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

class TournamentTest(unittest.TestCase):
    """Test tournament creation and listing functionality."""

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

    def test_create_tournament_and_view_list(self):
        """Test creating a tournament and viewing it in the list."""
        self.login_as_organizer()
        
        try:
            # Navigate to tournament creation page
            self.driver.get(f"{BASE_URL}/torneios/novo")
            
            # Wait for form to load
            time.sleep(1)
            
            # Generate unique tournament name
            unique_id = random.randint(1000, 9999)
            tournament_name = f"Torneio Teste {unique_id}"
            
            # Fill tournament form
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            nome_field.send_keys(tournament_name)
            
            edicao_field = self.wait.until(EC.visibility_of_element_located((By.ID, "edicao")))
            edicao_field.send_keys("2024")
            
            # Select categoria using Select component
            categoria_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "categoria")))
            categoria_trigger.click()
            time.sleep(0.5)
            
            # Click on "Adulto" option
            adulto_option = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option' and contains(text(), 'Adulto')]")))
            adulto_option.click()
            time.sleep(0.5)
            
            # Select formato using Select component
            formato_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "formato")))
            formato_trigger.click()
            time.sleep(0.5)
            
            # Click on "Mata-mata" option
            matamata_option = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option' and contains(text(), 'Mata-mata')]")))
            matamata_option.click()
            time.sleep(0.5)
            
            criterios_field = self.wait.until(EC.visibility_of_element_located((By.ID, "criteriosDesempate")))
            criterios_field.send_keys("Saldo de gols")
            
            capacidade_field = self.wait.until(EC.visibility_of_element_located((By.ID, "capacidadeMaxima")))
            capacidade_field.send_keys("8")
            
            data_inicio_field = self.wait.until(EC.visibility_of_element_located((By.ID, "dataInicio")))
            data_inicio_field.send_keys("2024-12-01")
            
            data_fim_field = self.wait.until(EC.visibility_of_element_located((By.ID, "dataFim")))
            data_fim_field.send_keys("2024-12-31")
            
            # Submit form
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Wait for navigation or success
            time.sleep(2)
            
            # Navigate to tournaments list
            self.driver.get(f"{BASE_URL}/torneios")
            
            # Wait for page to load
            page_heading = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Torneios')]"))
            )
            self.assertTrue(page_heading.is_displayed(), "Tournaments page not loaded")
            
            # Verify tournament appears in the list
            tournament_in_list = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, f"//td[contains(text(), '{tournament_name}')]"))
            )
            self.assertTrue(tournament_in_list.is_displayed(), f"Tournament '{tournament_name}' not found in list")
            
            print(f"✓ Tournament '{tournament_name}' created and verified in list")
            
        except Exception as e:
            print(f"Error during tournament test: {e}")
            self.fail(f"Tournament test failed: {e}")

    def tearDown(self):
        """Clean up after test."""
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
