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

      // Referencia al botón de envío
      const submitButton = document.querySelector('.btn-submit');
      // Deshabilitar y agregar clase de carga para evitar reenvío
      submitButton.disabled = true;
      submitButton.classList.add("btn-loading");

      // Validación básica del email
      const email = document.getElementById("email").value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        submitButton.disabled = false;
        submitButton.classList.remove("btn-loading");
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
              // Se envía el token obtenido
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
                  alertMessage = `Gracias ${templateParams.from_name} por tu solicitud. Te hemos enviado un mensaje a ${templateParams.from_email}. Si no lo encuentras en tu inbox, por favor revisa la carpeta SPAM`;
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
                    // Reactivar el botón de envío
                    submitButton.disabled = false;
                    submitButton.classList.remove("btn-loading");
                  })
                  .catch(function (error) {
                    console.error("Error al enviar EmailJS:", error);
                    alert("Error al enviar el mensaje. Inténtalo de nuevo.");
                    // Reactivar el botón en caso de error
                    submitButton.disabled = false;
                    submitButton.classList.remove("btn-loading");
                  });
              } else {
                // Si la validación de reCAPTCHA falla
                console.error('Error en reCAPTCHA:', data.error);
                alert("Error en reCAPTCHA: " + data.error);
                submitButton.disabled = false;
                submitButton.classList.remove("btn-loading");
              }
            })
            .catch(err => {
              console.error('Error al validar reCAPTCHA:', err);
              submitButton.disabled = false;
              submitButton.classList.remove("btn-loading");
            });
          })
          .catch(err => {
            console.error("Error en la ejecución de reCAPTCHA:", err);
            submitButton.disabled = false;
            submitButton.classList.remove("btn-loading");
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

/**
 * A lightweight youtube embed. Still should feel the same to the user, just MUCH faster to initialize and paint.
 *
 * Thx to these as the inspiration
 *   https://storage.googleapis.com/amp-vs-non-amp/youtube-lazy.html
 *   https://autoplay-youtube-player.glitch.me/
 *
 * Once built it, I also found these:
 *   https://github.com/ampproject/amphtml/blob/master/extensions/amp-youtube (👍👍)
 *   https://github.com/Daugilas/lazyYT
 *   https://github.com/vb/lazyframe
 */
class LiteYTEmbed extends HTMLElement {
    connectedCallback() {
        this.videoId = this.getAttribute('videoid');

        let playBtnEl = this.querySelector('.lyt-playbtn,.lty-playbtn');
        // A label for the button takes priority over a [playlabel] attribute on the custom-element
        this.playLabel = (playBtnEl && playBtnEl.textContent.trim()) || this.getAttribute('playlabel') || 'Play';

        this.dataset.title = this.getAttribute('title') || "";

        /**
         * Lo, the youtube poster image!  (aka the thumbnail, image placeholder, etc)
         *
         * See https://github.com/paulirish/lite-youtube-embed/blob/master/youtube-thumbnail-urls.md
         */
        if (!this.style.backgroundImage) {
          this.style.backgroundImage = `url("assets/images/miniatura_youtube.webp")`;
          this.upgradePosterImage();
        }

        // Set up play button, and its visually hidden label
        if (!playBtnEl) {
            playBtnEl = document.createElement('button');
            playBtnEl.type = 'button';
            // Include the mispelled 'lty-' in case it's still being used. https://github.com/paulirish/lite-youtube-embed/issues/65
            playBtnEl.classList.add('lyt-playbtn', 'lty-playbtn');
            this.append(playBtnEl);
        }
        if (!playBtnEl.textContent) {
            const playBtnLabelEl = document.createElement('span');
            playBtnLabelEl.className = 'lyt-visually-hidden';
            playBtnLabelEl.textContent = this.playLabel;
            playBtnEl.append(playBtnLabelEl);
        }

        this.addNoscriptIframe();

        // for the PE pattern, change anchor's semantics to button
        if(playBtnEl.nodeName === 'A'){
            playBtnEl.removeAttribute('href');
            playBtnEl.setAttribute('tabindex', '0');
            playBtnEl.setAttribute('role', 'button');
            // fake button needs keyboard help
            playBtnEl.addEventListener('keydown', e => {
                if( e.key === 'Enter' || e.key === ' ' ){
                    e.preventDefault();
                    this.activate();
                }
            });
        }

        // On hover (or tap), warm up the TCP connections we're (likely) about to use.
        this.addEventListener('pointerover', LiteYTEmbed.warmConnections, {once: true});
        this.addEventListener('focusin', LiteYTEmbed.warmConnections, {once: true});

        // Once the user clicks, add the real iframe and drop our play button
        // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
        //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
        this.addEventListener('click', this.activate);

        // Chrome & Edge desktop have no problem with the basic YouTube Embed with ?autoplay=1
        // However Safari desktop and most/all mobile browsers do not successfully track the user gesture of clicking through the creation/loading of the iframe,
        // so they don't autoplay automatically. Instead we must load an additional 2 sequential JS files (1KB + 165KB) (un-br) for the YT Player API
        // TODO: Try loading the the YT API in parallel with our iframe and then attaching/playing it. #82
        this.needsYTApi = this.hasAttribute("js-api") || navigator.vendor.includes('Apple') || navigator.userAgent.includes('Mobi');
    }

    /**
     * Add a <link rel={preload | preconnect} ...> to the head
     */
    static addPrefetch(kind, url, as) {
        const linkEl = document.createElement('link');
        linkEl.rel = kind;
        linkEl.href = url;
        if (as) {
            linkEl.as = as;
        }
        document.head.append(linkEl);
    }

    /**
     * Begin pre-connecting to warm up the iframe load
     * Since the embed's network requests load within its iframe,
     *   preload/prefetch'ing them outside the iframe will only cause double-downloads.
     * So, the best we can do is warm up a few connections to origins that are in the critical path.
     *
     * Maybe `<link rel=preload as=document>` would work, but it's unsupported: http://crbug.com/593267
     * But TBH, I don't think it'll happen soon with Site Isolation and split caches adding serious complexity.
     */
    static warmConnections() {
        if (LiteYTEmbed.preconnected) return;

        // The iframe document and most of its subresources come right off youtube.com
        LiteYTEmbed.addPrefetch('preconnect', 'https://www.youtube-nocookie.com');
        // The botguard script is fetched off from google.com
        LiteYTEmbed.addPrefetch('preconnect', 'https://www.google.com');

        // Not certain if these ad related domains are in the critical path. Could verify with domain-specific throttling.
        LiteYTEmbed.addPrefetch('preconnect', 'https://googleads.g.doubleclick.net');
        LiteYTEmbed.addPrefetch('preconnect', 'https://static.doubleclick.net');

        LiteYTEmbed.preconnected = true;
    }

    fetchYTPlayerApi() {
        if (window.YT || (window.YT && window.YT.Player)) return;

        this.ytApiPromise = new Promise((res, rej) => {
            var el = document.createElement('script');
            el.src = 'https://www.youtube.com/iframe_api';
            el.async = true;
            el.onload = _ => {
                YT.ready(res);
            };
            el.onerror = rej;
            this.append(el);
        });
    }

    /** Return the YT Player API instance. (Public L-YT-E API) */
    async getYTPlayer() {
        if(!this.playerPromise) {
            await this.activate();
        }

        return this.playerPromise;
    }

    async addYTPlayerIframe() {
        this.fetchYTPlayerApi();
        await this.ytApiPromise;

        const videoPlaceholderEl = document.createElement('div')
        this.append(videoPlaceholderEl);

        const paramsObj = Object.fromEntries(this.getParams().entries());

        this.playerPromise = new Promise(resolve => {
            let player = new YT.Player(videoPlaceholderEl, {
                width: '100%',
                videoId: this.videoId,
                playerVars: paramsObj,
                events: {
                    'onReady': event => {
                        event.target.playVideo();
                        resolve(player);
                    }
                }
            });
        });
    }

    // Add the iframe within <noscript> for indexability discoverability. See https://github.com/paulirish/lite-youtube-embed/issues/105
    addNoscriptIframe() {
        const iframeEl = this.createBasicIframe();
        const noscriptEl = document.createElement('noscript');
        // Appending into noscript isn't equivalant for mysterious reasons: https://html.spec.whatwg.org/multipage/scripting.html#the-noscript-element
        noscriptEl.innerHTML = iframeEl.outerHTML;
        this.append(noscriptEl);
    }

    getParams() {
        const params = new URLSearchParams(this.getAttribute('params') || []);
        params.append('autoplay', '1');
        params.append('playsinline', '1');
        return params;
    }

    async activate(){
        if (this.classList.contains('lyt-activated')) return;
        this.classList.add('lyt-activated');

        if (this.needsYTApi) {
            return this.addYTPlayerIframe(this.getParams());
        }

        const iframeEl = this.createBasicIframe();
        this.append(iframeEl);

        // Set focus for a11y
        iframeEl.focus();
    }

    createBasicIframe(){
        const iframeEl = document.createElement('iframe');
        iframeEl.width = 560;
        iframeEl.height = 315;
        // No encoding necessary as [title] is safe. https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#:~:text=Safe%20HTML%20Attributes%20include
        iframeEl.title = this.playLabel;
        iframeEl.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframeEl.allowFullscreen = true;
        // AFAIK, the encoding here isn't necessary for XSS, but we'll do it only because this is a URL
        // https://stackoverflow.com/q/64959723/89484
        iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${this.getParams().toString()}`;
        return iframeEl;
    }

    /**
     * In the spirit of the `lowsrc` attribute and progressive JPEGs, we'll upgrade the reliable
     * poster image to a higher resolution one, if it's available.
     * Interestingly this sddefault webp is often smaller in filesize, but we will still attempt it second
     * because getting _an_ image in front of the user if our first priority.
     *
     * See https://github.com/paulirish/lite-youtube-embed/blob/master/youtube-thumbnail-urls.md for more details
     */
    upgradePosterImage() {
         // Defer to reduce network contention.
        setTimeout(() => {
            const webpUrl = `https://i.ytimg.com/vi_webp/${this.videoId}/sddefault.webp`;
            const img = new Image();
            img.fetchPriority = 'low'; // low priority to reduce network contention
            img.referrerpolicy = 'origin'; // Not 100% sure it's needed, but https://github.com/ampproject/amphtml/pull/3940
            img.src = webpUrl;
            img.onload = e => {
                // A pretty ugly hack since onerror won't fire on YouTube image 404. This is (probably) due to
                // Youtube's style of returning data even with a 404 status. That data is a 120x90 placeholder image.
                // … per "annoying yt 404 behavior" in the .md
                const noAvailablePoster = e.target.naturalHeight == 90 && e.target.naturalWidth == 120;
                if (noAvailablePoster) return;

                this.style.backgroundImage = `url("${webpUrl}")`;
            }
        }, 100);
    }
}
// Register custom element
customElements.define('lite-youtube', LiteYTEmbed);

