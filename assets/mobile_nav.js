document.addEventListener('DOMContentLoaded', function () {
  var drawer = document.getElementById('mobile-menu-drawer');
  if (!drawer) return;
  var triggers = document.querySelectorAll('[data-mobile-menu-trigger]');
  triggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      drawer.classList.toggle('is-open');
      triggers.forEach(function (el) {
        el.classList.toggle('is-open');
      });
    });
  });
});
