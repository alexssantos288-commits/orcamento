// Função básica de autenticação
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}
function login(user, pass) {
    // Mock login
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({name: user}));
}
