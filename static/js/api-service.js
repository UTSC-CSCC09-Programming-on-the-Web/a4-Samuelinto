/* eslint-disable no-unused-vars */
let apiService = (function () {
  "use strict";
  let module = {};

  /*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) imageId 
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date
  */

  function authorizedFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // add an image to the gallery
  module.addImage = function (title, author, file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title || "No title");
    formData.append("author", author || "Unknown");

    return authorizedFetch("/api/images", {
      method: "POST",
      body: formData,
    }).then((res) => res.json());
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId) {
    return authorizedFetch(`/api/images/${imageId}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  // add a comment to an image
  module.addComment = function (imageId, content) {
    return authorizedFetch(`/api/images/${imageId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }).then((res) => res.json());
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    return authorizedFetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  module.getComments = function (imageId, page) {
    return authorizedFetch(`/api/images/${imageId}/comments?page=${page || 0}`)
      .then((res) => {
        if (res.status === 401) return null;
        return res.json();
      })
      .then((data) => data?.comments || []);
  };

  module.getImages = function (page = 0, limit = 10, mode = "all") {
    const url = new URL("/api/images", window.location.origin);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    if (mode === "mine") {
      url.searchParams.set("mode", "mine");
      return authorizedFetch(url.toString()).then((res) => res.json());
    } else {
      return fetch(url.toString()).then((res) => res.json());
    }
  };

  module.getImageById = function (id) {
    return fetch(`/api/images/${id}`).then((res) => res.json());
  };

  module.logout = function (redirect = true) {
    const token = localStorage.getItem("token");

    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    localStorage.removeItem("token");
    cachedUser = null;

    if (redirect) window.location.href = "/login.html";
  };

  module.isAuthenticated = function () {
    const token = localStorage.getItem("token");
    return !!token;
  };

  let cachedUser = null;

  module.getCurrentUser = function () {
    if (cachedUser) return Promise.resolve(cachedUser);

    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve(null);

    return authorizedFetch("/api/auth/validate")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        cachedUser = data;
        return data;
      });
  };

  return module;
})();
