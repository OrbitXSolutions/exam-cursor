"""Branding visual/behavior checks against a running frontend, using local API fixtures.
Run with Python Playwright and Chromium; override BRANDING_BASE_URL, CHROMIUM_PATH,
and BRANDING_SCREENSHOTS if needed. No real provider credentials or exam data are used.
"""
import os
import json
import re
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

EXAMS = [{
    'id': 999, 'examType': 0, 'titleEn': 'Digital skills assessment', 'titleAr': 'تقييم المهارات الرقمية',
    'descriptionEn': 'A secure assessment of digital services and identity.', 'descriptionAr': 'تقييم آمن للخدمات الرقمية والهوية.',
    'startAt': None, 'endAt': None, 'durationMinutes': 60, 'maxAttempts': 2, 'passScore': 70,
    'totalQuestions': 25, 'totalPoints': 100, 'myAttempts': 0, 'myBestIsPassed': None,
}, {
    'id': 998, 'examType': 0, 'titleEn': 'Communication assessment', 'titleAr': 'تقييم مهارات التواصل',
    'descriptionEn': 'Continue your assessment.', 'descriptionAr': 'تابع اختبارك.',
    'startAt': None, 'endAt': None, 'durationMinutes': 30, 'maxAttempts': 2, 'passScore': 60,
    'totalQuestions': 10, 'totalPoints': 20, 'myAttempts': 1, 'myBestIsPassed': None,
    'latestAttemptId': 999, 'latestAttemptStatus': 2,
}]


def candidate(context, language='en', theme='light'):
    context.add_init_script("""localStorage.setItem('auth_token', 'test-only-fixture');
        localStorage.setItem('user', JSON.stringify({id:'fixture', role:'Candidate', fullName:'Candidate', fullNameEn:'Candidate', fullNameAr:'المرشح', email:'candidate@example.invalid'}));"""
        + f"localStorage.setItem('language', {json.dumps(language)});localStorage.setItem('theme', {json.dumps(theme)});")


def fonts(page):
    page.evaluate("document.fonts.ready")
    assert page.evaluate("document.fonts.check('400 16px Dubai') && document.fonts.check('700 16px Dubai')")
    assert 'Dubai' in page.locator('body').evaluate('e => getComputedStyle(e).fontFamily')


def fixture(context, branding=None, unavailable=False, providers=True):
    state = {'branding': branding or DEFAULT, 'unavailable': unavailable, 'saves': [], 'session': SESSION, 'exams': EXAMS}
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
        elif path.endswith('/Candidate/exams/999/preview'):
            data = {**EXAMS[0], 'examId': 999, 'instructions': [],
                    'accessPolicy': {'requireProctoring': False, 'requireWebcam': False,
                                     'requireIdVerification': False, 'requireFullscreen': False,
                                     'requiresAccessCode': False, 'enableScreenMonitoring': False},
                    'eligibility': {'canStartNow': True, 'attemptsUsed': 0, 'reasons': [], 'attemptsRemaining': 2}}
        elif path.endswith('/Candidate/attempts/999/session'):
            data = state['session']
        elif path.endswith('/answers') or path.endswith('/answer'):
            state['saves'].append(route.request.post_data_json)
            data = True
        elif path.endswith('/proctor/authentication/status'):
            data = {'hasSubmitted': True, 'status': 'Approved'}
        elif '/candidate-status/' in path:
            data = {'hasWarning': False, 'isTerminated': False}
        elif path.endswith('/Candidate/exams'):
            data = state['exams']
        else:
            data = {}
        route.fulfill(json={'success': True, 'data': data, 'message': ''})
    context.route('**/api/**', respond)
    return state


def chrome(page, width):
    expect(page.locator('.brand-header')).to_be_visible()
    fonts(page)
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
    print('PASS branded exam desktop/mobile layout, viewport controls and answer autosave', flush=True)

    for language in ['en', 'ar']:
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        state = fixture(context)
        candidate(context, language)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/my-exams')
        expect(page.locator('.candidate-exam-grid > [data-slot=card]')).to_have_count(2)
        for width in [1440, 1024, 768, 375, 320]:
            page.set_viewport_size({'width': width, 'height': 900})
            chrome(page, width)
            grid = page.locator('.candidate-exam-grid')
            assert grid.evaluate('e => e.scrollWidth <= e.clientWidth'), 'Candidate cards overflow'
            page.screenshot(path=str(OUT / f'my-exams-{language}-{width}.png'), full_page=True)
        search = page.get_by_role('textbox', name='Search' if language == 'en' else 'بحث', exact=True)
        search.fill('Digital' if language == 'en' else 'الرقمية')
        expect(page.locator('.candidate-exam-grid > [data-slot=card]')).to_have_count(1)
        search.fill('no-such-exam')
        expect(page.locator('.candidate-exam-grid')).to_have_count(0)
        search.fill('')
        filters = page.get_by_role('group', name='Filter' if language == 'en' else 'تصفية', exact=True)
        filters.get_by_role('button').nth(2).click()
        expect(page.locator('.candidate-exam-grid > [data-slot=card]')).to_have_count(1)
        expect(page.locator('.candidate-exam-grid a')).to_have_attribute('href', '/take-exam/999')
        filters.get_by_role('button').first.click()
        expect(page.locator('.candidate-exam-grid > [data-slot=card]')).to_have_count(2)
        menu = page.get_by_role('button', name='Open navigation' if language == 'en' else 'فتح القائمة', exact=True)
        menu.click()
        drawer = page.get_by_role('dialog')
        expect(drawer).to_be_visible()
        box = drawer.bounding_box()
        assert abs((box['x'] if language == 'en' else box['x'] + box['width'] - 320)) < 2, 'Drawer opens on wrong side'
        for _ in range(12):
            page.keyboard.press('Tab')
            assert drawer.evaluate('e => e.contains(document.activeElement)'), 'Focus escaped mobile navigation'
        page.screenshot(path=str(OUT / f'navigation-{language}-320.png'), full_page=True)
        # Escape first dismisses an active logout tooltip, then its parent drawer.
        if page.get_by_role('tooltip').count():
            page.keyboard.press('Escape')
            expect(page.get_by_role('tooltip')).to_have_count(0)
        page.keyboard.press('Escape')
        expect(drawer).to_have_count(0)
        expect(menu).to_be_focused()
        menu.click()
        drawer.get_by_role('link', name='Identity' if language == 'en' else 'التحقق من الهوية', exact=True).click()
        expect(page).to_have_url(re.compile('/verify-identity$'))
        expect(drawer).to_have_count(0)
        chrome(page, 320)
        page.screenshot(path=str(OUT / f'identity-{language}-320.png'), full_page=True)
        page.goto(BASE + '/my-exams')
        page.set_viewport_size({'width': 1440, 'height': 900})
        collapse = page.get_by_role('button', name='Collapse navigation' if language == 'en' else 'طي القائمة')
        collapse.click()
        expect(page.get_by_role('navigation', name='Main navigation' if language == 'en' else 'القائمة الرئيسية').get_by_role('link', name='My Exams' if language == 'en' else 'اختباراتي', exact=True)).to_have_attribute('aria-current', 'page')
        chrome(page, 1440)
        page.screenshot(path=str(OUT / f'navigation-collapsed-{language}.png'), full_page=True)
        assert not errors, errors
        context.close()
        print(f'PASS Candidate cards, search/filters, links, responsive navigation, focus and identity ({language})', flush=True)

    for language in ['en', 'ar']:
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        state = fixture(context)
        candidate(context, language, 'dark')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/take-exam/999')
        expect(page.get_by_role('radiogroup')).to_be_visible(timeout=60000)
        summary = page.get_by_role('button', name='Summary' if language == 'en' else 'الملخص', exact=True, include_hidden=True)
        for width in [1440, 768, 375, 320]:
            page.set_viewport_size({'width': width, 'height': 900})
            chrome(page, width)
            summary.click()
            expect(summary).to_have_attribute('aria-expanded', 'true')
            if width < 768:
                panel = page.get_by_role('dialog')
                expect(panel).to_be_visible()
                box = panel.bounding_box()
                assert abs((box['x'] + box['width'] - width if language == 'en' else box['x'])) < 2
                for _ in range(8):
                    page.keyboard.press('Tab')
                    assert panel.evaluate('e => e.contains(document.activeElement)')
                page.screenshot(path=str(OUT / f'exam-summary-{language}-{width}.png'), full_page=True)
                page.keyboard.press('Escape')
                expect(panel).to_have_count(0)
                expect(summary).to_be_focused()
            else:
                expect(page.get_by_role('complementary')).to_be_visible()
                page.get_by_role('button', name='Close summary' if language == 'en' else 'إغلاق الملخص').click()
            expect(summary).to_have_attribute('aria-expanded', 'false')
            page.screenshot(path=str(OUT / f'exam-dark-{language}-{width}.png'), full_page=True)
        page.get_by_role('radio').first.click()
        expect(page.get_by_role('radio').first).to_be_checked()
        page.wait_for_timeout(500)
        assert state['saves'], 'Arabic/dark answer autosave failed'
        page.get_by_role('button', name='Submit' if language == 'en' else 'إرسال', exact=True).last.click()
        expect(page.get_by_role('alertdialog')).to_be_visible()
        page.get_by_role('alertdialog').get_by_role('button', name='Cancel' if language == 'en' else 'إلغاء', exact=True).click()
        expect(page.get_by_role('radio').first).to_be_checked()
        assert not errors, errors
        context.close()
        print(f'PASS dark/RTL exam, desktop/mobile summary, keyboard focus, autosave and submit/cancel ({language})', flush=True)

    for language in ['en', 'ar']:
        context = browser.new_context(viewport={'width': 320, 'height': 900}, reduced_motion='reduce')
        state = fixture(context)
        candidate(context, language)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/take-exam/999/instructions')
        agree = page.locator('#agree')
        expect(agree).to_be_visible(timeout=60000)
        expect(agree).to_be_enabled()
        agree.click()
        expect(agree).to_be_checked()
        chrome(page, 320)
        page.screenshot(path=str(OUT / f'instructions-{language}-320.png'), full_page=True)
        state['session'] = json.loads(json.dumps(SESSION))
        state['session']['sections'] = [{
            'sectionId': 1, 'order': 1, 'titleEn': 'Digital services', 'titleAr': 'الخدمات الرقمية',
            'totalPoints': 1, 'totalQuestions': 1, 'answeredQuestions': 0,
            'topics': [], 'questions': SESSION['questions'],
        }]
        page.goto(BASE + '/take-exam/999')
        expect(page.get_by_role('tab')).to_be_visible(timeout=60000)
        expect(page.get_by_role('radio').first).to_be_visible()
        page.get_by_role('radio').first.click()
        expect(page.get_by_role('radio').first).to_be_checked()
        page.wait_for_timeout(500)
        assert state['saves']
        for width in [320, 768, 1440]:
            page.set_viewport_size({'width': width, 'height': 900})
            chrome(page, width)
            page.screenshot(path=str(OUT / f'exam-section-{language}-{width}.png'), full_page=True)
        assert not errors, errors
        context.close()
        print(f'PASS instructions/consent and section-based exam layout/autosave ({language})', flush=True)

    for theme in ['light', 'dark']:
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        fixture(context)
        context.add_init_script(f"localStorage.setItem('theme', {json.dumps(theme)})")
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for path in ['/', '/faq']:
            for width in [1440, 768, 320]:
                page.set_viewport_size({'width': width, 'height': 900})
                page.goto(BASE + path)
                chrome(page, width)
                if path == '/':
                    page.wait_for_function("[...document.querySelectorAll('h1')].some(e => getComputedStyle(e).opacity === '1')")
                    page.wait_for_timeout(500)  # Let the existing staggered hero transition finish.
                page.screenshot(path=str(OUT / f'public-{path.strip("/") or "home"}-{theme}-{width}.png'))
        assert not errors, errors
        context.close()
        print(f'PASS public landing and FAQ theme/font regression checks ({theme})', flush=True)

    browser.close()
