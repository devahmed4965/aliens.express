document.addEventListener('DOMContentLoaded', () => {
  /* ====================================================
     Language Toggle Setup
  ==================================================== */
  const toggleLangButton = document.getElementById('toggleLang');
  const translations = {
    ar: {
      home: "الرئيسية",
      tracking: "تتبع الشحنة",
      pickup: "حجز بيك اب",
      services: "خدماتنا",
      about: "من نحن",
      login: "دخول",
      title: "Aliens Express",
      subtitle: "With Light's Speed.",
      trackNow: "تتبع شحنتك الآن",
      bookPickup: "اطلب خدمة البيك اب",
      footerText: "شحن سريع وموثوق يصل إلى كل مكان.",
      quickLinks: "روابط سريعة",
      contactUs: "تواصل معنا",
      address: "مصر - البحيرة - دمنهور",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
      rights: "جميع الحقوق محفوظة.",
      trackingTitle: "تتبع شحنتك بسهولة",
      pickupTitle: "احجز خدمة البيك اب",
      servicesTitle: "خدماتنا المتكاملة",
      aboutTitle: "لماذا تختار Aliens Express?"
    },
    en: {
      home: "Home",
      tracking: "Track Shipment",
      pickup: "Book Pickup",
      services: "Our Services",
      about: "About Us",
      login: "Login",
      title: "Aliens Express",
      subtitle: "With Light's Speed",
      trackNow: "Track Your Shipment Now",
      bookPickup: "Request Pickup Service",
      footerText: "Fast and reliable shipping anywhere.",
      quickLinks: "Quick Links",
      contactUs: "Contact Us",
      address: "Egypt - Elbehera - Damanhour",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      rights: "All rights reserved.",
      trackingTitle: "Track Your Shipment Easily",
      pickupTitle: "Book a Pickup Service",
      servicesTitle: "Our Comprehensive Services",
      aboutTitle: "Why Choose Aliens Express?"
    }
  };

  let currentLang = localStorage.getItem('lang') || 'ar';
  setLanguage(currentLang);

  toggleLangButton.addEventListener('click', () => {
    currentLang = (currentLang === 'ar') ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
    setLanguage(currentLang);
  });

  function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-key]').forEach(element => {
      const key = element.getAttribute('data-key');
      if (translations[lang] && translations[lang][key]) {
        element.textContent = translations[lang][key];
      }
    });
    toggleLangButton.textContent = (lang === 'ar') ? 'EN' : 'AR';
  }

  /* ====================================================
     Nav Toggle Functionality
  ==================================================== */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    // عند الضغط على زر القائمة على الهاتف
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
    
    // عند الضغط على رابط من روابط القائمة، إغلاق القائمة على الهواتف
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768 && navMenu.classList.contains('active')) {
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

  // إذا تغير حجم الشاشة إلى جهاز كمبيوتر (≥768px) يتم إزالة كلاس "active"
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      navMenu.classList.remove('active');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
  });

  /* ====================================================
     Helper Functions (Spinner & Status Message)
  ==================================================== */
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

  /* ====================================================
     Tracking System (GET)
  ==================================================== */
  const trackingForm = document.getElementById('trackingForm');
  const trackingResultDiv = document.getElementById('trackingResult');
  const trackingSpinner = document.getElementById('trackingSpinner');

  if (trackingForm && trackingResultDiv) {
    const trackingInput = document.getElementById('trackingInput');
    const trackingScriptBaseURL = 'https://script.google.com/macros/s/AKfycbwSuZ_TRV8VQWGv-W1nRG1gqr3c3ToFEBwAwJofCC1glQr4b4wYSRRSkg8DpzFW6tg/exec';
    // تأكد من إخفاء نتيجة التتبع مبدئيًا
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
          result.data.sort((a, b) => new Date(b.LastUpdate) - new Date(a.LastUpdate));
          const latest = result.data[0];
          let shippingStatus = latest.Status || 'غير متوفر';
          if (shippingStatus.trim().toLowerCase() === 'hold to be returned') {
            shippingStatus = 'فى مخزن المرتجعات';
          } else if (shippingStatus.trim().toLowerCase() === 'جاري التوصيل') {
            shippingStatus = 'الشحنة خرجت للتوصيل';
          }
          trackingResultDiv.innerHTML = `
            <div class="tracking-status" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
              <p><strong>رقم البوليصة:</strong> ${latest.PolicyNumber || 'غير متوفر'}</p>
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

  /* ====================================================
     Pickup System (POST)
  ==================================================== */
  const pickupForm = document.getElementById('pickupForm');
  if (pickupForm) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSuZ_TRV8VQWGv-W1nRG1gqr3c3ToFEBwAwJofCC1glQr4b4wYSRRSkg8DpzFW6tg/exec';
    const pickupFormStatus = document.getElementById('pickupFormStatus');
    const submitButton = pickupForm.querySelector('button[type="submit"]');

    pickupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
      showStatusMessage(pickupFormStatus, 'جاري إرسال طلبك...', 'info', 0);

      const formData = {
        Name: pickupForm.Name.value,
        Email: pickupForm.Email.value,
        Phone: pickupForm.Phone.value,
        PickupAddress: pickupForm.PickupAddress.value,
        DeliveryAddress: pickupForm.DeliveryAddress.value,
        Weight: pickupForm.Weight.value,
        Details: pickupForm.Details.value
      };

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

  /* ====================================================
     AOS Initialization
  ==================================================== */
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  } else {
    console.log('AOS غير موجود.');
  }
});
