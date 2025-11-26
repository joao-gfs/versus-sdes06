import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from config import BASE_URL

class BracketDrawTest(unittest.TestCase):
    """Test bracket draw and visualization functionality."""

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

    def test_draw_bracket_and_view(self):
        """Test drawing a tournament bracket and viewing it."""
        self.login_as_organizer()
        
        try:
            # Navigate to tournaments list
            self.driver.get(f"{BASE_URL}/torneios")
            
            # Wait for page to load
            page_heading = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Torneios')]"))
            )
            self.assertTrue(page_heading.is_displayed(), "Tournaments page not loaded")
            
            # Find a tournament in "em configuração" status with the "Sortear Chaveamento" button
            # According to populate_db.sql, "Torneio Regional" (id=2) is in "em configuração" status
            # Look for the "Sortear Chaveamento" button
            sortear_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Sortear Chaveamento') or contains(text(), '🎲')]"))
            )
            
            # Get the tournament name before clicking
            tournament_row = sortear_button.find_element(By.XPATH, "./ancestor::tr")
            tournament_name_cell = tournament_row.find_element(By.XPATH, ".//td[1]")
            tournament_name = tournament_name_cell.text
            
            print(f"Found tournament '{tournament_name}' ready for bracket draw")
            
            # Click the "Sortear Chaveamento" button
            sortear_button.click()
            
            # Wait for confirmation and success message
            # There might be a confirmation dialog or direct success message
            try:
                # Check if there's a confirmation dialog
                confirm_button = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Confirmar') or contains(text(), 'Sim')]"))
                )
                confirm_button.click()
            except:
                # No confirmation dialog, continue
                pass
            
            # Verify success message
            success_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Chaveamento sorteado com sucesso') or contains(text(), 'sucesso')]"))
            )
            self.assertTrue(success_message.is_displayed(), "Success message not displayed")
            
            print(f"✓ Bracket drawn successfully for '{tournament_name}'")
            
            # Now find the "Ver Chaveamento" button for the same tournament
            # After sorting, the status should change and the button should appear
            time.sleep(1)  # Brief wait for UI to update
            
            # Refresh the page to see updated buttons
            self.driver.refresh()
            
            # Wait for page to reload
            self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Torneios')]"))
            )
            
            # Find the "Ver Chaveamento" button
            ver_chaveamento_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ver Chaveamento') or contains(text(), '🏆')]"))
            )
            ver_chaveamento_button.click()
            
            # Verify we're on the bracket visualization page
            # The URL should contain "/chaveamento"
            self.wait.until(EC.url_contains("/chaveamento"))
            
            # Verify bracket content is displayed
            # Look for match/bracket related elements
            bracket_content = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1 | //h2 | //div[contains(@class, 'bracket') or contains(@class, 'match') or contains(@class, 'partida')]"))
            )
            self.assertTrue(bracket_content.is_displayed(), "Bracket visualization not displayed")
            
            print(f"✓ Bracket visualization displayed successfully")
            
        except Exception as e:
            print(f"Error during bracket draw test: {e}")
            self.fail(f"Bracket draw test failed: {e}")

    def tearDown(self):
        """Clean up after test."""
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
