/* assets/js/scripts.js */

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar EmailJS con el user ID
  emailjs.init("ehgrelxiWjlD7JLqI");
  console.log("EmailJS inicializado con user ID: ehgrelxiWjlD7JLqI");

  // ----------------------------
  // Testimonial Carousel
  // ----------------------------
  let testimonials = [];
  let currentTestimonialIndex = 0;
  const carouselContainer = document.getElementById('testimonials-carousel');

  function loadTestimonials() {
    fetch('assets/data/testimonios.json')
      .then(response => response.json())
      .then(data => {
        testimonials = data;
        if (testimonials.length > 0) {
          displayTestimonial(currentTestimonialIndex);
          // Cambiar testimonio cada 10 segundos
          setInterval(() => {
            currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
            displayTestimonial(currentTestimonialIndex);
          }, 10000);
        }
      })
      .catch(error => console.error('Error al cargar testimonios:', error));
  }

  function displayTestimonial(index) {
    const testimonial = testimonials[index];
    carouselContainer.innerHTML = `
      <div class="carousel-item active">
        <img src="${testimonial.image}" alt="${testimonial.nombre}">
        <h3>${testimonial.nombre}</h3>
        <p><strong>${testimonial.profesion} - ${testimonial.pais}</strong></p>
        <p>"${testimonial.mensaje}"</p>
      </div>
    `;
  }

  // ----------------------------
  // FAQs Accordion
  // ----------------------------
  const faqsContainer = document.getElementById('faqs-accordion');

  function loadFAQs() {
    fetch('assets/data/faqs.json')
      .then(response => response.json())
      .then(data => {
        data.forEach((faq, index) => {
          const faqItem = document.createElement('div');
          faqItem.classList.add('faq-item');
          faqItem.innerHTML = `
            <div class="faq-question" data-index="${index}">${faq.question}</div>
            <div class="faq-answer" id="faq-answer-${index}">${faq.answer}</div>
          `;
          faqsContainer.appendChild(faqItem);
        });

        // Agregar evento para el acordeón
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
          question.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const answer = document.getElementById('faq-answer-' + index);
            answer.style.display = (answer.style.display === "block") ? "none" : "block";
          });
        });
      })
      .catch(error => console.error('Error al cargar FAQs:', error));
  }

  // ----------------------------
  // Envío del Formulario con EmailJS + reCAPTCHA v3
  // ----------------------------
  const form = document.getElementById("contact_form");
  if (!form) {
    console.error("No se encontró el formulario con id 'contact_form'.");
  } else {
    form.addEventListener("submit", function (event) {
      event.preventDefault(); // Evita el envío por defecto
      console.log("Evento submit capturado.");

      // Validación básica del email
      const email = document.getElementById("email").value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        return;
      }

      // Ejecutar reCAPTCHA v3 para obtener el token
      grecaptcha.ready(function() {
        grecaptcha.execute('6LfQkOEqAAAAAOVi-wdWOMLtjUyM1DyBTZVf91Ie', { action: 'submit' })
          .then(function(token) {
            console.log("reCAPTCHA token generado:", token);

            // Llamada a la función serverless en Netlify para validar el token
            fetch('/.netlify/functions/validate-recaptcha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Se envía el token obtenido; se reemplazó "tuTokenObtenido" por "token"
              body: JSON.stringify({ token: token })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                console.log('Validación exitosa, score:', data.score);

                // Prepara los parámetros para el envío del correo
                const templateParams = {
                  from_name: document.getElementById("name").value,
                  from_email: email,
                  request_type: document.getElementById("request_type").value,
                  message: document.getElementById("message").value,
                  recaptcha_response: token, // Se envía el token de reCAPTCHA
                };
                console.log("Parámetros a enviar:", templateParams);

                // Determinar la plantilla y el mensaje de alerta según la solicitud
                let selectedTemplate = "";
                let alertMessage = "";
                if (templateParams.request_type === "Solicitar GT-NutriForm 5") {
                  selectedTemplate = "autoresponder_gt";
                  alertMessage = `Gracias ${templateParams.from_name} por tu solicitud. Te hemos enviado un mensaje a ${templateParams.from_email}`;
                } else if (
                  templateParams.request_type === "Solicitar Soporte Técnico" ||
                  templateParams.request_type === "Solicitar Asesoramiento"
                ) {
                  selectedTemplate = "Soporte_Asesoria";
                  alertMessage = `Gracias ${templateParams.from_name} por tu mensaje. Nos pondremos en contacto a la mayor brevedad vía ${templateParams.from_email}`;
                } else {
                  selectedTemplate = "Soporte_Asesoria";
                  alertMessage = `Gracias ${templateParams.from_name} por tu mensaje. Nos pondremos en contacto a la mayor brevedad vía ${templateParams.from_email}`;
                }

                // Envío del correo usando EmailJS
                emailjs.send("service_7x8onyc", selectedTemplate, templateParams)
                  .then(function (response) {
                    console.log("EmailJS respuesta:", response);
                    alert(alertMessage);
                    form.reset(); // Limpia el formulario
                  })
                  .catch(function (error) {
                    console.error("Error al enviar EmailJS:", error);
                    alert("Error al enviar el mensaje. Inténtalo de nuevo.");
                  });
              } else {
                // Si la validación falla, se muestra el error
                console.error('Error en reCAPTCHA:', data.error);
                alert("Error en reCAPTCHA: " + data.error);
              }
            })
            .catch(err => console.error('Error al validar reCAPTCHA:', err));
          });
      });
    });
  }

  // ----------------------------
  // CTA: Scroll al Formulario y Preselección
  // ----------------------------
  const actionElements = document.querySelectorAll('.cta, .contact-link');
  actionElements.forEach(element => {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      const solicitudForm = document.getElementById('solicitud-form');
      if (solicitudForm) {
        solicitudForm.scrollIntoView({ behavior: 'smooth' });
      }
      const requestTypeSelect = document.getElementById('request_type');
      if (requestTypeSelect) {
        let solicitud = element.getAttribute('data-solicitud');
        if (!solicitud) {
          solicitud = "Solicitar GT-NutriForm 5";
        }
        requestTypeSelect.value = solicitud;
      }
    });
  });

  // ----------------------------
  // Mobile Menu Toggle
  // ----------------------------
  const mobileMenu = document.getElementById('mobile-menu');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenu && navMenu) {
    mobileMenu.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Cargar contenido dinámico: Testimonios y FAQs
  loadTestimonials();
  loadFAQs();
});
