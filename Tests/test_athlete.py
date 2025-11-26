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

class AthleteTest(unittest.TestCase):
    """Test athlete creation and listing functionality."""

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

    def login_as_coach(self):
        """Helper method to log in as team coach."""
        self.driver.get(f"{BASE_URL}/login")
        
        # Login with coach credentials from users.txt (Tite - Flamengo)
        username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        username_field.send_keys("tite@flamengo.com")
        
        password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
        password_field.send_keys("Senha123")
        
        submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, "login-button")))
        submit_button.click()
        
        # Wait for login to complete
        self.wait.until(EC.url_changes(f"{BASE_URL}/login"))

    def test_create_athlete_and_view_list(self):
        """Test creating an athlete and viewing it in the list."""
        self.login_as_coach()
        
        try:
            # Navigate to athlete creation page
            self.driver.get(f"{BASE_URL}/atletas/novo")
            
            # Generate unique athlete data
            unique_id = random.randint(1000, 9999)
            athlete_name = f"Atleta Teste {unique_id}"
            
            # Fill athlete form
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            nome_field.send_keys(athlete_name)
            
            data_nascimento_field = self.wait.until(EC.visibility_of_element_located((By.ID, "dataNascimento")))
            data_nascimento_field.send_keys("2000-01-15")
            
            documento_field = self.wait.until(EC.visibility_of_element_located((By.ID, "documento")))
            # Generate a random 11-digit document number
            documento = f"{random.randint(10000000000, 99999999999)}"
            documento_field.send_keys(documento)
            
            posicao_field = self.wait.until(EC.visibility_of_element_located((By.ID, "posicao")))
            posicao_field.send_keys("Atacante")
            
            numero_camisa_field = self.wait.until(EC.visibility_of_element_located((By.ID, "numeroCamisa")))
            numero_camisa_field.send_keys(str(random.randint(1, 99)))
            
            # Submit form
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Verify success message
            success_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Atleta criado com sucesso') or contains(text(), 'sucesso')]"))
            )
            self.assertTrue(success_message.is_displayed(), "Success message not displayed")
            
            # Navigate to athletes list
            self.driver.get(f"{BASE_URL}/atletas")
            
            # Wait for page to load
            page_heading = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Atletas')]"))
            )
            self.assertTrue(page_heading.is_displayed(), "Athletes page not loaded")
            
            # Verify athlete appears in the list
            athlete_in_list = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, f"//td[contains(text(), '{athlete_name}')]"))
            )
            self.assertTrue(athlete_in_list.is_displayed(), f"Athlete '{athlete_name}' not found in list")
            
            print(f"✓ Athlete '{athlete_name}' created and verified in list")
            
        except Exception as e:
            print(f"Error during athlete test: {e}")
            self.fail(f"Athlete test failed: {e}")

    def tearDown(self):
        """Clean up after test."""
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
