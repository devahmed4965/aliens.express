document.addEventListener('DOMContentLoaded', () => {
  // ----- Helper Functions -----
  function showSpinner(el) {
    if (el) el.classList.remove('hidden');
  }

  function hideSpinner(el) {
    if (el) el.classList.add('hidden');
  }

  function showStatusMessage(el, message, type = 'info', duration = 5000) {
    if (!el) return;
    el.textContent = message;
    el.className = `form-status ${type}`;
    el.style.display = 'block';
    if (duration > 0) {
      setTimeout(() => {
        if (el.textContent === message) {
          el.textContent = '';
          el.style.display = 'none';
          el.className = 'form-status';
        }
      }, duration);
    }
  }

  // ----- Navigation & Animation -----
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          const icon = navToggle.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        }
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId.startsWith('#') && targetId.length > 1) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    });
  });

  // ----- Tracking System (GET) -----
  const trackingForm = document.getElementById('trackingForm');
  const trackingResultDiv = document.getElementById('trackingResult');
  const trackingSpinner = document.getElementById('trackingSpinner');
  if (trackingForm && trackingResultDiv) {
    const trackingInput = document.getElementById('trackingInput');
    // رابط Google Apps Script للتتبع
    const trackingScriptBaseURL = 'https://script.google.com/macros/s/AKfycbwSuZ_TRV8VQWGv-W1nRG1gqr3c3ToFEBwAwJofCC1glQr4b4wYSRRSkg8DpzFW6tg/exec';

    trackingResultDiv.classList.add('hidden');

    trackingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const trackingNumber = trackingInput ? trackingInput.value.trim() : '';
      if (!trackingNumber) {
        trackingResultDiv.innerHTML = "<p class='error' style='color: red; margin-top: 10px;'>⚠️ الرجاء إدخال رقم التتبع.</p>";
        trackingResultDiv.classList.remove('hidden');
        return;
      }

      showSpinner(trackingSpinner);
      trackingResultDiv.classList.add('hidden');
      trackingResultDiv.innerHTML = '';

      try {
        const url = `${trackingScriptBaseURL}?action=getTrackingData&trackingNumber=${encodeURIComponent(trackingNumber)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`فشل الاتصال بالخادم: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        if (result.result === 'success' && result.data && result.data.length > 0) {
          // ترتيب النتائج بحسب عمود LastUpdate (إذا كان موجوداً)
          result.data.sort((a, b) => new Date(b.LastUpdate) - new Date(a.LastUpdate));
          const latest = result.data[0];
          // تعديل حالة الشحنة بناءً على النص المُستلم
          let shippingStatus = latest.Status || 'غير متوفر';
          if (shippingStatus.trim().toLowerCase() === 'hold to be returned') {
            shippingStatus = 'فى مخزن المرتجعات';
          } else if (shippingStatus.trim().toLowerCase() === 'جاري التوصيل') {
            shippingStatus = 'الشحنة خرجت للتوصيل';
          }
          trackingResultDiv.innerHTML = `
            <div class="tracking-status" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
              <p><strong>رقم البوليصه:</strong> ${latest.PolicyNumber || 'غير متوفر'}</p>
              <p><strong>حالة الشحنة:</strong> ${shippingStatus}</p>
              <p><strong>آخر تحديث:</strong> ${latest.LastUpdate ? new Date(latest.LastUpdate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير متوفر'}</p>
              <p><strong>الموقع الحالي:</strong> ${latest.Location || 'غير متوفر'}</p>
              <p><strong>التسليم المتوقع:</strong> ${latest.EstimatedDelivery || 'غير محدد'}</p>
              <p><strong>اسم الشركة:</strong> ${latest.CompanyName || 'غير متوفر'}</p>
            </div>
          `;
        } else if (result.result === 'success') {
          trackingResultDiv.innerHTML = `<p class='info' style='color: orange; margin-top: 10px;'>لم يتم العثور على بيانات للشحنة رقم: ${trackingNumber}</p>`;
        } else {
          trackingResultDiv.innerHTML = `<p class='error' style='color: red; margin-top: 10px;'>خطأ: ${result.message || 'خطأ غير معروف'}</p>`;
        }
        trackingResultDiv.classList.remove('hidden');
      } catch (error) {
        console.error('Tracking Error:', error);
        trackingResultDiv.innerHTML = `<p class='error' style='color: red; margin-top: 10px;'>حدث خطأ أثناء تتبع الشحنة (${error.message})</p>`;
        trackingResultDiv.classList.remove('hidden');
      } finally {
        hideSpinner(trackingSpinner);
      }
    });
  }

  // ----- Pickup System (POST) -----
  const pickupForm = document.getElementById('pickupForm');
  if (pickupForm) {
    // استبدل SCRIPT_URL برابط Google Apps Script المنشور الخاص بك
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSuZ_TRV8VQWGv-W1nRG1gqr3c3ToFEBwAwJofCC1glQr4b4wYSRRSkg8DpzFW6tg/exec';
    const pickupFormStatus = document.getElementById('pickupFormStatus');
    const submitButton = pickupForm.querySelector('button[type="submit"]');

    pickupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
      showStatusMessage(pickupFormStatus, 'جاري إرسال طلبك...', 'info', 0);

      // تجميع بيانات النموذج
      const formData = {
        Name: pickupForm.Name.value,
        Email: pickupForm.Email.value,
        Phone: pickupForm.Phone.value,
        PickupAddress: pickupForm.PickupAddress.value,
        DeliveryAddress: pickupForm.DeliveryAddress.value,
        Weight: pickupForm.Weight.value,
        Details: pickupForm.Details.value
      };

      // التحقق من الحقول الأساسية
      if (!formData.Name || !formData.Phone) {
        showStatusMessage(pickupFormStatus, 'الاسم ورقم الهاتف حقول إجبارية', 'error', 5000);
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        return;
      }

      try {
        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`;
          try {
            const errRes = await response.json();
            errMsg = errRes.message || errMsg;
          } catch (_) {
            errMsg = await response.text();
          }
          throw new Error(`فشل إرسال الطلب: ${errMsg}`);
        }

        const result = await response.json();
        if (result.result === 'success') {
          pickupForm.reset();
          showStatusMessage(pickupFormStatus, 'تم استلام طلبك بنجاح!', 'success', 5000);
        } else {
          throw new Error(result.message || 'خطأ غير معروف');
        }
      } catch (error) {
        console.error('Pickup Error:', error);
        showStatusMessage(pickupFormStatus, `حدث خطأ: ${error.message}`, 'error', 0);
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
    });
  } else {
    console.warn("لم يتم العثور على نموذج البيك اب (pickupForm).");
  }

  // ----- Admin Panel (إن وجد) -----
  if (document.location.pathname.includes('admin.html')) {
    console.log('تم الكشف عن صفحة الإدارة.');
    // يمكنك إضافة كود إدارة الطلبات هنا
  }

  // ----- تهيئة AOS -----
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  } else {
    console.log('AOS غير موجود.');
  }
});

// تهيئة AOS مرة أخرى لضمان تطبيق الإعدادات
AOS.init({
  duration: 800,
  once: true
});

// مثال إضافي لتفعيل بعض المحاكاة لنموذج تتبع الشحنة ونموذج البيك اب باستخدام محاكاة API
document.addEventListener('DOMContentLoaded', () => {
  // التعامل مع نموذج تتبع الشحنة مع محاكاة API
  const trackingForm = document.getElementById('trackingForm');
  const trackingInput = document.getElementById('trackingInput');
  const trackingResult = document.getElementById('trackingResult');
  const trackingSpinner = document.getElementById('trackingSpinner');

  if (trackingForm && trackingInput && trackingResult && trackingSpinner) {
    trackingForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const trackingNumber = trackingInput.value.trim();

      if (!trackingNumber) {
        displayTrackingResult('<p class="error-message"><i class="fas fa-exclamation-triangle"></i> يرجى إدخال رقم التتبع.</p>');
        return;
      }

      trackingSpinner.classList.remove('hidden');
      trackingResult.classList.add('hidden');
      trackingResult.innerHTML = '';

      // محاكاة طلب API لمدة 1.5 ثانية
      console.log(`البحث عن رقم التتبع: ${trackingNumber}`);
      setTimeout(() => {
        trackingSpinner.classList.add('hidden');

        const fakeApiResponse = {
          found: Math.random() > 0.3,
          status: "قيد التسليم",
          location: "مركز الفرز الرئيسي، دمنهور",
          estimatedDelivery: "4 أبريل 2025",
          history: [
            { date: "3 أبريل 2025", time: "08:00 ص", event: "تم استلام الشحنة من المرسل" },
            { date: "3 أبريل 2025", time: "09:00 ص", event: "غادرت مركز الفرز" }
          ]
        };

        if (fakeApiResponse.found) {
          let historyHtml = fakeApiResponse.history.map(item =>
            `<li><strong>${item.date} ${item.time}:</strong> ${item.event}</li>`
          ).join('');
  
          displayTrackingResult(`
            <h4><i class="fas fa-shipping-fast"></i> حالة الشحنة: ${fakeApiResponse.status}</h4>
            <p><i class="fas fa-map-marker-alt"></i> الموقع الحالي: ${fakeApiResponse.location}</p>
            <p><i class="fas fa-calendar-alt"></i> التوصيل المتوقع: ${fakeApiResponse.estimatedDelivery}</p>
            <h5><i class="fas fa-history"></i> سجل التتبع:</h5>
            <ul>${historyHtml}</ul>
          `);
        } else {
          displayTrackingResult(`<p class="error-message"><i class="fas fa-exclamation-triangle"></i> لم يتم العثور على شحنة بهذا الرقم. يرجى التحقق والمحاولة مرة أخرى.</p>`);
        }
        AOS.refresh();
      }, 1500);
    });
  }

  function displayTrackingResult(htmlContent) {
    if (trackingResult) {
      trackingResult.innerHTML = htmlContent;
      trackingResult.classList.remove('hidden');
    }
  }

  // التعامل مع نموذج طلب البيك اب (باستخدام Formspree كمثال)
  const pickupForm = document.getElementById('pickupForm');
  const pickupFormStatus = document.getElementById('pickupFormStatus');

  if (pickupForm && pickupFormStatus) {
    pickupForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      const formData = new FormData(pickupForm);
      pickupFormStatus.innerHTML = '<div class="processing"><i class="fas fa-spinner fa-spin"></i> جاري إرسال طلبك...</div>';

      try {
        const response = await fetch(pickupForm.action, {
          method: pickupForm.method,
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          pickupFormStatus.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> تم إرسال طلب البيك اب بنجاح! سنتواصل معك قريباً.</div>';
          pickupForm.reset();
        } else {
          const data = await response.json();
          if (Object.hasOwnProperty.call(data, 'errors')) {
            pickupFormStatus.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> خطأ: ${data["errors"].map(error => error["message"]).join(", ")}</div>`;
          } else {
            pickupFormStatus.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> حدث خطأ غير متوقع أثناء إرسال النموذج.</div>';
          }
        }
      } catch (error) {
        console.error('Form submission error:', error);
        pickupFormStatus.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> تعذر إرسال الطلب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</div>';
      } finally {
        setTimeout(() => {
          pickupFormStatus.innerHTML = '';
        }, 6000);
      }
    });
  }
});
