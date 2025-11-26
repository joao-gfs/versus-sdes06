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
        
        # Login with organizer credentials from users.txt
        username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
        username_field.send_keys("carlos@liga.com")
        
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
            
            # Generate unique tournament name
            unique_id = random.randint(1000, 9999)
            tournament_name = f"Torneio Teste {unique_id}"
            
            # Fill tournament form
            nome_field = self.wait.until(EC.visibility_of_element_located((By.ID, "nome")))
            nome_field.send_keys(tournament_name)
            
            edicao_field = self.wait.until(EC.visibility_of_element_located((By.ID, "edicao")))
            edicao_field.send_keys("2024")
            
            categoria_field = self.wait.until(EC.visibility_of_element_located((By.ID, "categoria")))
            categoria_field.send_keys("Adulto")
            
            # Select formato (Mata-mata)
            formato_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "formato")))
            formato_trigger.click()
            
            # Wait for dropdown and select first option
            first_formato_option = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option'][1]")))
            first_formato_option.click()
            
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
            
            # Verify success message
            success_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Torneio criado com sucesso') or contains(text(), 'sucesso')]"))
            )
            self.assertTrue(success_message.is_displayed(), "Success message not displayed")
            
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
