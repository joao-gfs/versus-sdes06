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

class LogInTest(unittest.TestCase):
    """A class to test login functionality."""

    def setUp(self):
        """Set up the test environment.
        This method is called before each test method."""
        
        # --- Set up Firefox options ---
        options = FirefoxOptions()
        #options.add_argument("-headless") # Run in headless mode (no browser window)
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # Initialize the Firefox driver using webdriver_manager
        # This automatically downloads and manages GeckoDriver
        service = FirefoxService(executable_path=GeckoDriverManager().install())
        
        self.driver = webdriver.Firefox(service=service, options=options)
        
        # Define a standard wait time for elements to appear
        self.wait = WebDriverWait(self.driver, 10) # 10-second maximum wait

    def test_successful_login(self):
        """Test a login attempt with valid credentials."""
        
        # 1. Navigate to the login page
        self.driver.get(f"{BASE_URL}/login")
        
        try:
            # 2. Find the username field and type the username
            # We wait until the element is visible before interacting
            username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
            username_field.send_keys("joao.org@example.com")
            
            # 3. Find the password field and type the password
            password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
            password_field.send_keys("Org123456")
            
            # 4. Find and click the submit button
            submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, "login-button")))
            submit_button.click()
            
            # 5. Verify the login was successful
            # We check for a specific element on the "logged in" page
            success_header = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//h1[text()='Versus Homepage']"))
            )
            
            # 6. Assert that the success message is displayed
            self.assertTrue(success_header.is_displayed(), "Success header not found.")
            
            # Also, assert the URL has changed
            self.assertNotIn("/login", self.driver.current_url)

        except Exception as e:
            # If any step fails, print the exception and fail the test
            print(f"Error during successful login test: {e}")
            self.fail("Successful login test encountered an error.")

    def test_failed_login(self):
        """Test a login attempt with invalid credentials."""
        
        # 1. Navigate to the login page
        self.driver.get(f"{BASE_URL}/login")
        
        try:
            # 2. Find and fill fields with invalid data
            username_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
            username_field.send_keys("joao.org@example.com")
            
            password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
            password_field.send_keys("WrongPassword123") # Invalid password
            
            # 3. Find and click the submit button
            submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, "login-button")))
            submit_button.click()
            
            # 4. Verify that an error message is displayed
            self.wait.until(
                EC.text_to_be_present_in_element(
                    (By.ID, "error"), 
                    "Email ou senha inválidos"
                )
            )
            
            error_message = self.driver.find_element(By.ID, "error")
            self.assertIn("Email ou senha inválidos", error_message.text) # Specific error text

        except Exception as e:
            # If any step fails, print the exception and fail the test
            print(f"Error during failed login test: {e}")
            self.fail("Failed login test encountered an error.")

    def tearDown(self):
        """Clean up after each test.
        This method is called after each test method."""
        
        # Close the browser window
        self.driver.quit()

if __name__ == "__main__":
    # This allows the test to be run directly from the script
    unittest.main()