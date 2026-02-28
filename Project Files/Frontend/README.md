# 📚 BookNest: Where Stories Nestle

A full-stack MERN e-commerce web application for buying and selling books, featuring role-based access for Users, Sellers, and Admins.

---

## 🌐 Live Demo

> https://drive.google.com/file/d/1HUXlMt4-7G1kUZaNiXjvDa_Ousxvy3OX/view?usp=drivesdk

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Roles & Responsibilities](#roles--responsibilities)
- [Screenshots](#screenshots)
- [Known Issues](#known-issues)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About the Project

**BookNest** is a comprehensive full-stack book store web application that connects book lovers, independent sellers, and platform administrators through a seamless digital marketplace.

Whether you're a reader looking for your next favorite book, a seller managing your inventory, or an admin overseeing the platform — BookNest has a tailored experience for you.

---

## ✨ Features

### 👤 User
- Register, login, and manage your profile
- Browse books by genre, title, or author
- Add books to cart and checkout securely
- View order history and track purchases
- Submit reviews and star ratings for books and sellers

### 🛒 Seller
- Register a seller account and manage business profile
- List books with full metadata (title, author, genre, price, stock)
- Manage inventory — update stock, remove listings
- View and fulfill incoming orders
- Access sales analytics and performance stats

### 🔧 Admin
- Full platform oversight and system management
- Manage user and seller accounts (create, update, delete)
- Moderate book listings and reviews
- Approve new seller registrations
- View platform-wide statistics and reports

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| Image Storage | Cloudinary |
| Styling | CSS  |
| Version Control | Git, GitHub |
| Dev Tools | VS Code, Postman, MongoDB Compass |

---

## 🗂 Folder Structure

```
booknest/
├── client/                         # React frontend
│   └── src/
│       ├── components/
│       │   ├── common/             # Navbar, ProtectedRoute, RoleBasedRoute, ProfileForm
│       │   ├── reviews/            # AddReview, StarRating, RatingSummary, RatingDistribution
│       │   └── seller/             # SellerReview, ImageManagement, MiniCart
│       ├── context/                # AuthContext.js, CartContext.js
│       ├── hooks/                  # Custom React hooks
│       ├── pages/
│       │   ├── admin/              # AdminCreate, AdminOrders, AdminReviews, AdminStats
│       │   │                       # EditAccount, ManageAccounts, ManageSellers
│       │   ├── commonpages/        # AddBook, Dashboard, EditBook, InventoryManagement, ManageBooks
│       │   ├── seller/             # SellerOrders, SellerReviews, SellerStats
│       │   ├── user/               # Cart, Checkout, History, OrderHistory, Payment, UserStats
│       │   ├── auth/               # Login, Register pages
│       │   ├── Books.jsx
│       │   ├── BookDetails.jsx
│       │   ├── Home.jsx
│       │   ├── NotFound.jsx
│       │   └── ProfilePage.jsx
│       └── services/               # Axios API service modules
│
└── server/                         # Node.js + Express backend
    ├── config/                     # Database connection
    ├── controllers/                # Business logic
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── bookController.js
    │   ├── cartController.js
    │   ├── dashboardController.js
    │   ├── orderController.js
    │   ├── profileController.js
    │   ├── reviewController.js
    │   └── userAnalyticsController.js
    ├── middleware/                  # JWT auth, role authorization
    ├── models/                     # Mongoose schemas
    │   ├── Book.js
    │   ├── Cart.js
    │   ├── Order.js
    │   ├── Review.js
    │   └── User.js
    ├── routes/                     # Express route files
    ├── utils/                      # Helper functions
    └── .env                        # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/en/download/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v6 or higher)
- [Git](https://git-scm.com/downloads)

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/booknest.git
cd booknest
```

**2. Install client dependencies**

```bash
cd client
npm install
```

**3. Install server dependencies**

```bash
cd ../server
npm install
```

---

### Environment Variables

Create a `.env` file inside the `server/` directory and add the following:

```env
MONGO_URI=mongodb://localhost:27017/booknest
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ Never commit your `.env` file to version control.

---

### Running the App

**Start the backend server:**

```bash
cd server
npm start
```

> Runs on: `http://localhost:5000`

**Start the frontend development server:**

```bash
cd client
npm run dev
```

> Runs on: `http://localhost:5173`

> 💡 Both servers must be running simultaneously for the app to work correctly.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user/seller | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |

### Books
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/books` | Get all books (with filters) | No |
| GET | `/api/books/:id` | Get single book by ID | No |
| POST | `/api/books` | Create new book listing | Seller/Admin |
| PUT | `/api/books/:id` | Update book details | Seller/Admin |
| DELETE | `/api/books/:id` | Delete a book listing | Seller/Admin |

### Cart
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/cart` | Get user's cart | User |
| POST | `/api/cart/add` | Add item to cart | User |
| PUT | `/api/cart/update` | Update item quantity | User |
| DELETE | `/api/cart/remove/:bookId` | Remove item from cart | User |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/orders` | Get user's order history | User |
| POST | `/api/orders` | Place a new order | User |
| GET | `/api/orders/seller` | Get seller's orders | Seller |
| PUT | `/api/orders/:id/status` | Update order status | Seller/Admin |

### Reviews
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/reviews/book/:bookId` | Get reviews for a book | No |
| POST | `/api/reviews` | Submit a review | User |
| DELETE | `/api/reviews/:id` | Delete a review | Admin |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/admin/users` | Get all users | Admin |
| DELETE | `/api/admin/users/:id` | Delete a user | Admin |
| GET | `/api/admin/sellers` | Get all sellers | Admin |
| PUT | `/api/admin/sellers/:id/approve` | Approve a seller | Admin |
| GET | `/api/admin/stats` | Platform statistics | Admin |

---

## 🔐 Authentication

BookNest uses **JWT (JSON Web Token)** based authentication:

1. On register/login, the server returns a signed JWT token
2. The client stores the token and includes it in the `Authorization` header as `Bearer <token>` for protected requests
3. The `authMiddleware` on the server verifies and decodes the token
4. A `roleMiddleware` checks the user's role against the route's required permissions

**Roles:**

| Role | Access |
|---|---|
| `user` | Browse, cart, checkout, orders, reviews, profile |
| `seller` | User access + book listings, inventory, seller orders, analytics |
| `admin` | Full access including user/seller/book management and platform stats |

---

## 👥 Roles & Responsibilities

### User
- Register and manage their account
- Browse, search, and purchase books
- Leave reviews and ratings

### Seller
- List and manage book inventory
- Fulfill customer orders
- Track sales and performance

### Admin
- Manage all users, sellers, and book listings
- Approve seller registrations
- Maintain platform integrity

---

## 📸 Screenshots

> Add your screenshots here

| Screen | Preview |
|---|---|
| Home Page | *(Add screenshot)* |
| Book Detail | *(Add screenshot)* |
| Cart & Checkout | *(Add screenshot)* |
| Seller Dashboard | *(Add screenshot)* |
| Admin Panel | *(Add screenshot)* |

---

## 🐛 Known Issues

- No real-time order notifications (requires WebSocket integration)
- No email verification on registration
- Cart state resets on logout (no persistent server-side cart session)
- Payment is simulated — no real payment gateway integrated yet

---

## 🔮 Future Enhancements

- [ ] Real-time notifications with Socket.io
- [ ] Stripe / Razorpay payment gateway integration
- [ ] AI-powered book recommendation engine
- [ ] Mobile app with React Native
- [ ] E-book / digital download support
- [ ] Advanced search with Elasticsearch
- [ ] Full test suite with Jest and Cypress
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Multi-language and multi-currency support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Made with care by the BookNest Team
