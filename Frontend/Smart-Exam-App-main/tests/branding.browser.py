"""Task 2 visual/behavior checks against a running frontend, using local API fixtures.
Run with Python Playwright and Chromium; override BRANDING_BASE_URL, CHROMIUM_PATH,
and BRANDING_SCREENSHOTS if needed. No real provider credentials or exam data are used.
"""
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get('BRANDING_BASE_URL', 'http://127.0.0.1:3000')
OUT = Path(os.environ.get('BRANDING_SCREENSHOTS', '/tmp/branding-browser'))
OUT.mkdir(parents=True, exist_ok=True)
DEFAULT = {'name': 'Digital Dubai Exams', 'logoUrl': '/branding/digital-dubai.png',
           'faviconUrl': '/branding/favicon.png', 'primaryColor': '#0076a8',
           'footerText': 'Digital Dubai · Dubai Data and Statistics Establishment', 'isActive': False}
SESSION = {
    'attemptId': 999, 'examId': 999, 'examTitleEn': 'Digital skills assessment',
    'examTitleAr': 'تقييم المهارات الرقمية', 'startedAtUtc': '2026-09-30T00:00:00Z',
    'expiresAtUtc': '2099-01-01T00:00:00Z', 'remainingSeconds': 3600, 'status': 1,
    'attemptNumber': 1, 'maxAttempts': 2, 'totalQuestions': 1, 'answeredQuestions': 0,
    'examSettings': {'shuffleQuestions': False, 'shuffleOptions': False, 'lockPreviousSections': False,
                     'preventBackNavigation': False, 'requireProctoring': False, 'requireWebcam': False,
                     'requireFullscreen': False, 'enableScreenMonitoring': False},
    'sections': [], 'instructions': [], 'questions': [{
        'attemptQuestionId': 1, 'questionId': 1, 'order': 1, 'points': 1,
        'bodyEn': 'Select the secure sign-in method.', 'bodyAr': 'اختر طريقة تسجيل الدخول الآمنة.',
        'questionTypeName': 'MCQ', 'questionTypeId': 1, 'attachments': [], 'currentAnswer': None,
        'options': [{'id': 1, 'textEn': 'UAE PASS', 'textAr': 'الهوية الرقمية', 'order': 1, 'attachmentPath': None},
                    {'id': 2, 'textEn': 'Share your password', 'textAr': 'مشاركة كلمة المرور', 'order': 2, 'attachmentPath': None}],
    }],
}


def fixture(context, branding=None, unavailable=False, providers=True):
    state = {'branding': branding or DEFAULT, 'unavailable': unavailable, 'saves': []}
    def respond(route):
        path = urlparse(route.request.url).path
        if path == '/api/sso/providers':
            route.fulfill(json={'government': providers, 'uaePass': providers})
            return
        if path.endswith('/Organization/branding'):
            if state['unavailable']:
                route.fulfill(status=503, json={'message': 'Temporarily unavailable'})
                return
            data = state['branding']
        elif path.endswith('/Candidate/attempts/999/session'):
            data = SESSION
        elif path.endswith('/answers') or path.endswith('/answer'):
            state['saves'].append(route.request.post_data_json)
            data = True
        elif path.endswith('/proctor/authentication/status'):
            data = {'hasSubmitted': True, 'status': 'Approved'}
        elif '/candidate-status/' in path:
            data = {'hasWarning': False, 'isTerminated': False}
        elif path.endswith('/Candidate/exams'):
            data = []
        else:
            data = {}
        route.fulfill(json={'success': True, 'data': data, 'message': ''})
    context.route('**/api/**', respond)
    return state


def chrome(page, width):
    expect(page.locator('.brand-header')).to_be_visible()
    gov = page.get_by_alt_text('Government of Dubai').bounding_box()
    digital = page.locator('.brand-header .brand-digital-dubai').bounding_box()
    assert gov['x'] + gov['width'] <= digital['x'], 'Government logo must remain physically left'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}px'
    assert page.locator('.brand-header img').evaluate_all('imgs => imgs.every(i => i.complete && i.naturalWidth > 0)')


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    fixture(context)
    page = context.new_page()
    page.goto(BASE + '/candidate-login?returnUrl=%2Fmy-exams')
    gov = page.get_by_role('link', name='Government Sign in (SSO)')
    uae = page.get_by_role('link', name='Sign in with UAE PASS')
    expect(gov).to_have_attribute('href', '/api/sso/start/government?language=en&returnUrl=%2Fmy-exams')
    expect(uae).to_have_attribute('href', '/api/sso/start/uaepass?language=en&returnUrl=%2Fmy-exams')
    assert gov.bounding_box()['y'] < uae.bounding_box()['y'] < page.locator('summary').bounding_box()['y']
    for width in [1440, 768, 375, 320]:
        page.set_viewport_size({'width': width, 'height': 900})
        chrome(page, width)
        page.screenshot(path=str(OUT / f'candidate-login-{width}.png'), full_page=True)
    page.locator('summary').click()
    page.get_by_role('button', name='Candidate 1:').click()
    expect(page.get_by_label('Email', exact=True)).to_have_value('ali.it.candidate@examcore.com')
    expect(page.get_by_label('Password', exact=True)).to_have_value('Demo@123456')
    chrome(page, 320)
    page.get_by_role('button', name='Toggle language').click()
    page.get_by_role('menuitem', name='العربية').click()
    expect(page.locator('html')).to_have_attribute('dir', 'rtl')
    chrome(page, 320)
    expect(page.get_by_role('link', name='تسجيل الدخول بالهوية الرقمية')).to_have_attribute('href', '/api/sso/start/uaepass?language=ar&returnUrl=%2Fmy-exams')
    page.screenshot(path=str(OUT / 'candidate-login-arabic.png'), full_page=True)
    context.close()
    print('PASS responsive login, physical logo order, Arabic, provider links and retained demo accounts', flush=True)

    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    fixture(context, unavailable=True, providers=False)
    context.add_init_script("localStorage.setItem('accentColor', 'emerald')")
    page = context.new_page()
    page.goto(BASE + '/login')
    expect(page.get_by_role('heading', name='Digital Dubai Exams')).to_be_visible()
    expect(page.get_by_role('button', name='Government Sign in (SSO)')).to_be_disabled()
    expect(page.get_by_role('button', name='Sign in with UAE PASS')).to_be_disabled()
    page.locator('summary').click()
    expect(page.get_by_label('Email', exact=True)).to_be_visible()
    page.get_by_role('button', name='Toggle theme').click()
    page.get_by_role('menuitem', name='Dark', exact=True).click()
    expect(page.locator('html')).to_have_class('dark')
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()") == '195 80% 67%'
    chrome(page, 1440)
    page.screenshot(path=str(OUT / 'staff-login-dark-fallback.png'), full_page=True)
    context.close()
    print('PASS unavailable settings/providers fallback, old accent isolation, staff form and dark theme', flush=True)

    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    state = fixture(context, branding={**DEFAULT, 'name': 'Configured exams', 'primaryColor': '#663399', 'footerText': 'Configured footer'})
    page = context.new_page()
    page.goto(BASE + '/login')
    expect(page.get_by_role('heading', name='Configured exams')).to_be_visible()
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()") == '270 50% 40%'
    expect(page.locator('.brand-footer')).to_contain_text('Configured footer')
    state['branding'] = {**DEFAULT, 'name': 'Updated exams', 'primaryColor': '#0076a8'}
    page.evaluate("window.dispatchEvent(new Event('organization-branding-changed'))")
    expect(page.get_by_role('heading', name='Updated exams')).to_be_visible()
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()") == '198 100% 33%'
    context.close()
    print('PASS database branding presentation and refresh without a page reload', flush=True)

    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    state = fixture(context)
    context.add_init_script("""localStorage.setItem('auth_token', 'test-only-fixture');
        localStorage.setItem('user', JSON.stringify({id:'fixture', role:'Candidate', fullName:'Candidate', fullNameEn:'Candidate', email:'candidate@example.invalid'}));""")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/take-exam/999')
    expect(page.get_by_text('Select the secure sign-in method.', exact=True)).to_be_visible(timeout=60000)
    for width in [1440, 375, 320]:
        page.set_viewport_size({'width': width, 'height': 900})
        chrome(page, width)
        page.screenshot(path=str(OUT / f'exam-{width}.png'), full_page=True)
    assert page.locator('.brand-footer').bounding_box()['y'] <= 901
    page.get_by_text('UAE PASS', exact=True).click()
    page.wait_for_timeout(500)
    assert state['saves'], 'Answer autosave must remain operational with the shared chrome'
    assert not errors, errors
    context.close()
    browser.close()
    print('PASS branded exam desktop/mobile layout, viewport controls and answer autosave', flush=True)
