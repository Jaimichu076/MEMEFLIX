// js/main.js - navbar, usuario y utilidades
document.addEventListener('DOMContentLoaded', () => {
  // Navbar toggle
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if(toggle && navLinks){
    toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
  }

  // Mostrar usuario si existe
  const usuario = localStorage.getItem('usuarioMemeflix');
  document.querySelectorAll('.usuario').forEach(el => {
    el.textContent = usuario ? ` _ ${usuario}` : 'Invitado';
  });

  // Staff link guard (si existe)
  const staffLink = document.getElementById('staffLink');
  if(staffLink){
    staffLink.addEventListener('click', () => sessionStorage.setItem('staffEntry','fromIndex'));
  }
});
