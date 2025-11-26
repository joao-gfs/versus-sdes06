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

class CreateUserTest(unittest.TestCase):
    """A class to test user creation functionality."""

    def setUp(self):
        """Set up the test environment."""
        options = FirefoxOptions()
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # service = FirefoxService(executable_path=GeckoDriverManager().install())
        # Use cached geckodriver to avoid GitHub API rate limits
        service = FirefoxService(executable_path="/home/jgfs/.wdm/drivers/geckodriver/linux64/v0.36.0/geckodriver")
        self.driver = webdriver.Firefox(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def login(self):
        """Helper method to log in before testing user creation."""
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

    def test_create_user_success(self):
        """Test creating a new user successfully."""
        self.login()
        
        # Navigate to Create User page
        self.driver.get(f"{BASE_URL}/criar-usuario")
        
        try:
            # Fill form fields
            name_field = self.wait.until(EC.visibility_of_element_located((By.ID, "name")))
            name_field.send_keys("Test User")
            
            email_field = self.wait.until(EC.visibility_of_element_located((By.ID, "email")))
            # Use a unique email to avoid conflicts if run multiple times (though DB reset might be needed)
            # For now, using a timestamp or random string would be better, but let's stick to a simple one
            # and assume clean state or unique enough.
            import random
            unique_id = random.randint(1000, 9999)
            email_field.send_keys(f"testuser{unique_id}@example.com")
            
            password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "password")))
            password_field.send_keys("TestPass123")
            
            confirm_password_field = self.wait.until(EC.visibility_of_element_located((By.ID, "confirmPassword")))
            confirm_password_field.send_keys("TestPass123")
            
            # Handle Select Component (Radix UI / Shadcn UI usually)
            # Click the trigger
            role_trigger = self.wait.until(EC.element_to_be_clickable((By.ID, "role")))
            role_trigger.click()
            
            # Wait for content and click item. 
            # Note: Radix UI portals the content to the body usually.
            # We need to find the item with text 'Técnico' (since ORG can create TEC)
            # The value is 'TEC', the text is 'Técnico'
            # We can try finding by text.
            tec_option = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//div[@role='option']//span[text()='Técnico']")))
            tec_option.click()
            
            # Submit
            submit_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
            submit_button.click()
            
            # Verify success message
            success_message = self.wait.until(
                EC.visibility_of_element_located((By.XPATH, "//div[contains(text(), 'Usuário criado com sucesso!')]"))
            )
            self.assertTrue(success_message.is_displayed(), "Success message not displayed")
            
        except Exception as e:
            print(f"Error during create user test: {e}")
            self.fail(f"Create user test failed: {e}")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
