from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000/')

    # Take screenshot of whatever is there right now
    page.screenshot(path='/home/jules/verification/debug_start.png')

    try:
        # App might have different input placeholder
        page.locator('input[type="text"]').wait_for(state='visible', timeout=10000)
        page.locator('input[type="text"]').fill('mock')
        page.keyboard.press('Enter')
    except Exception as e:
        print(f"Failed to find input: {e}")

    try:
        page.wait_for_selector('button', state='visible')
        flow_btn = page.locator('button', has_text="Flow")
        if flow_btn.count() > 0:
            flow_btn.click()
            page.wait_for_selector('.mermaid-container svg .node', state='visible', timeout=10000)
            page.locator('.mermaid-container svg .node').first.hover()
            page.wait_for_timeout(500)
    except Exception as e:
        print(f"Failed to find flow button/render mermaid: {e}")

    page.screenshot(path='/home/jules/verification/flow_format.png')
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
