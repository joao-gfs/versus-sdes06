import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from config import BASE_URL
import random

class TeamTest(unittest.TestCase):
    """Test team creation and listing functionality."""

    def setUp(self):
        """Set up the test environment."""
        options = FirefoxOptions()
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # Use cached geckodriver
        service = FirefoxService(executable_path="/home/jgfs/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver")
        self.driver = webdriver.Firefox(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def login_as_organizer(self):
        """Helper method to log in as organizer."""
        self.driver.get(f"{BASE_URL}/login")
        
        # Login with organizer credentials from users.txt (Roberto - Associação)
        username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        username_field.send_keys("roberto@associacao.com")
        
        password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
        password_field.send_keys("Senha123")
        
        submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, "login-button")))
        submit_button.click()
        
        # Wait for login to complete
        self.wait.until(EC.url_changes(f"{BASE_URL}/login"))

    def test_create_team_and_view_list(self):
        """Test creating a team and viewing it in the list."""
        self.login_as_organizer()
        
        try:
            # Navigate to team creation page
            self.driver.get(f"{BASE_URL}/equipes/nova")
            
            # Wait for form to load
            time.sleep(1)
            
            # Generate unique team name
            unique_id = random.randint(1000, 9999)
            team_name = f"Equipe Teste {unique_id}"
            
            # Fill team form
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            nome_field.send_keys(team_name)
            
            # Select tecnico (required field) - select first available user
            tecnico_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "tecnico")))
            tecnico_trigger.click()
            time.sleep(0.5)
            
            # Click on first tecnico option
            first_tecnico = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option'][1]")))
            first_tecnico.click()
            time.sleep(0.5)
            
            telefone_field = self.wait.until(EC.visibility_of_element_located((By.ID, "telefone")))
            telefone_field.send_keys("11987654321")
            
            email_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
            email_field.send_keys(f"equipe{unique_id}@teste.com")
            
            capacidade_field = self.wait.until(EC.visibility_of_element_located((By.ID, "capacidadeMaxima")))
            capacidade_field.send_keys("22")
            
            # Submit form
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Wait for navigation or success
            time.sleep(2)
            
            # Navigate to teams list
            self.driver.get(f"{BASE_URL}/equipes")
            
            # Wait for page to load
            page_heading = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Equipes')]"))
            )
            self.assertTrue(page_heading.is_displayed(), "Teams page not loaded")
            
            # Verify team appears in the list
            team_in_list = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, f"//td[contains(text(), '{team_name}')]"))
            )
            self.assertTrue(team_in_list.is_displayed(), f"Team '{team_name}' not found in list")
            
            print(f"✓ Team '{team_name}' created and verified in list")
            
        except Exception as e:
            print(f"Error during team test: {e}")
            self.fail(f"Team test failed: {e}")

    def tearDown(self):
        """Clean up after test."""
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
