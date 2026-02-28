import api from "./api";


export const getBookById = async (id) => {
  const { data } = await api.get(`/books/${id}`);
  return data;
};

export const getTopRatedBooks = async () => {
  const { data } = await api.get("/books/top-rated");
  return data;
};


export const createBook = async (formData) => {
  const { data } = await api.post("/books", formData);
  return data;
};

export const updateBook = async (id, formData) => {
  const { data } = await api.put(`/books/${id}`, formData);
  return data;
};

export const deleteBook = async (id) => {
  const { data } = await api.delete(`/books/${id}`);
  return data;
};

export const getDashboardBooks = async () => {
  const { data } = await api.get("/books/dashboard");
  return data;
};


export const updateBookStock = async (id, data) => {
  const res = await api.put(`/books/${id}/stock`, data);
  return res.data;
};

export const toggleBookStatus = async (id) => {
  const res = await api.put(`/books/${id}/status`);
  return res.data;
};

export const getHomepageData = async () => {
  try {
    const res = await api.get('/books/homepage');
    return res.data; 
  } catch (error) {
    console.error("Failed to fetch homepage data", error);
    return { 
      newArrivals: [], 
      mostReviewed: [], 
      topRated: [],
      stats: { totalBooks: 0, totalReviews: 0 },
      booksForFilters: []
    };
  }
};


export const getAllBooks = async (params = {}) => {
  try {
    const res = await api.get('/books', { params });
    return res.data; 
  } catch (error) {
    console.error("Failed to fetch books", error);
    return { books: [], currentPage: 1, totalPages: 1, totalBooks: 0 };
  }
};


export const getBookFilters = async () => {
  try {
    const res = await api.get('/books/filters');
    return res.data;
  } catch (error) {
    console.error("Failed to fetch filters", error);
    return { categories: [], genres: [] };
  }
};


export const getRelatedBooks = async (id) => {
  try {
    const res = await api.get(`/books/${id}/related`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch related books", error);
    return []; 
  }
};