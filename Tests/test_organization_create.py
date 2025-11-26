import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.firefox import GeckoDriverManager
from config import BASE_URL
import random

def generate_cnpj():
    def calculate_digit(digits, weights):
        s = sum(d * w for d, w in zip(digits, weights))
        remainder = s % 11
        return 0 if remainder < 2 else 11 - remainder

    # Gera os primeiros 8 dígitos aleatórios
    root = [random.randint(0, 9) for _ in range(8)]
    # Adiciona a filial padrão '0001'
    branch = [0, 0, 0, 1]
    base = root + branch

    # Calcula 1º dígito verificador
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    digit1 = calculate_digit(base, weights1)
    base.append(digit1)

    # Calcula 2º dígito verificador
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    digit2 = calculate_digit(base, weights2)
    base.append(digit2)

    # Retorna como string apenas números (ex: "12345678000199")
    return "".join(map(str, base))


class CreateOrganizationTest(unittest.TestCase):
    """A class to test organization creation functionality."""

    def setUp(self):
        """Set up the test environment."""
        options = FirefoxOptions()
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # Use cached geckodriver to avoid GitHub API rate limits
        service = FirefoxService(executable_path="/home/jgfs/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver")
        self.driver = webdriver.Firefox(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def login(self):
        """Helper method to log in as ADM before testing organization creation."""
        self.driver.get(f"{BASE_URL}/login")
        
        # Login with admin credentials from users.txt
        username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        username_field.send_keys("admin@versus.com")
        
        password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
        password_field.send_keys("Senha123")
        
        submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, "login-button")))
        submit_button.click()
        
        # Wait for login to complete
        self.wait.until(EC.url_changes(f"{BASE_URL}/login"))

    def test_create_organization_success(self):
        """Test creating a new organization successfully."""
        self.login()
        
        # Navigate to Create Organization page
        self.driver.get(f"{BASE_URL}/organizacoes/nova")
        
        try:
            # Fill form fields
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            import random
            unique_id = random.randint(1000, 9999)
            nome_field.send_keys(f"Test Organization {unique_id}")
            
            cnpj_field = self.wait.until(EC.visibility_of_element_located((By.ID, "cnpj")))
            # Generate a valid-format CNPJ (format will be applied automatically)
            cnpj_field.send_keys(generate_cnpj())
            
            # Handle Select Component for Responsavel
            responsavel_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "responsavel")))
            responsavel_trigger.click()
            
            # Wait for content and click first available user
            # The select items are portaled to body
            first_user_option = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option'][1]")))
            first_user_option.click()
            
            telefone_field = self.wait.until(EC.visibility_of_element_located((By.ID, "telefone")))
            telefone_field.send_keys("11987654321")
            
            email_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
            email_field.send_keys(f"org{unique_id}@example.com")
            
            endereco_field = self.wait.until(EC.visibility_of_element_located((By.ID, "endereco")))
            endereco_field.send_keys("Test Address 123")
            
            # Submit
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Verify success message
            success_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Organização criada com sucesso!')]"))
            )
            self.assertTrue(success_message.is_displayed(), "Success message not displayed")
            
        except Exception as e:
            print(f"Error during create organization test: {e}")
            self.fail(f"Create organization test failed: {e}")

    def test_create_organization_missing_required_fields(self):
        """Test creating an organization with missing required fields."""
        self.login()
        
        # Navigate to Create Organization page
        self.driver.get(f"{BASE_URL}/organizacoes/nova")
        
        try:
            # Only fill nome field, leave others empty
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            nome_field.send_keys("Incomplete Organization")
            
            # Try to submit without filling other required fields
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Verify error message appears
            error_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'text-red-500')]"))
            )
            self.assertTrue(error_message.is_displayed(), "Error message not displayed")
            
        except Exception as e:
            print(f"Error during missing fields test: {e}")
            self.fail(f"Missing fields test failed: {e}")

    def test_navigate_to_organizations_list(self):
        """Test navigating to the organizations list page."""
        self.login()
        
        try:
            # Navigate to Organizations list page
            self.driver.get(f"{BASE_URL}/organizacoes")
            
            # Verify we're on the correct page by checking for a heading or specific element
            # This will depend on the OrganizacoesPage implementation
            page_heading = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1 | //h2"))
            )
            self.assertTrue(page_heading.is_displayed(), "Organizations page heading not found")
            
        except Exception as e:
            print(f"Error during navigation test: {e}")
            self.fail(f"Navigation test failed: {e}")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
