const Base64 = { encode: function(str) { return btoa(unescape(encodeURIComponent(str))); }, decode: function(str) { return decodeURIComponent(escape(atob(str))); } };
window.Base64 = Base64;