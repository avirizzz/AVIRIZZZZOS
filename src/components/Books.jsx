import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import '../styles/Books.css';

const Books = () => {
  const { addXP } = useContext(AppContext);
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    id: '',
    title: '',
    author: '',
    totalPages: '',
    currentPage: '0',
    startDate: '',
    finishDate: '',
    genre: '',
    notes: '',
    rating: 0,
    completed: false
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filter, setFilter] = useState('all'); // all, reading, completed

  // Load books from localStorage on component mount
  useEffect(() => {
    const savedBooks = localStorage.getItem('userBooks');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
  }, []);

  // Save books to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userBooks', JSON.stringify(books));
  }, [books]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook(prev => ({ ...prev, [name]: value }));
  };

  const addBook = (e) => {
    e.preventDefault();
    
    if (!newBook.title) {
      alert('Please enter a book title');
      return;
    }
    
    const bookToAdd = {
      ...newBook,
      id: uuidv4(),
      currentPage: newBook.currentPage || '0',
      totalPages: newBook.totalPages || '0',
      completed: false
    };
    
    setBooks(prev => [...prev, bookToAdd]);
    setNewBook({
      id: '',
      title: '',
      author: '',
      totalPages: '',
      currentPage: '0',
      startDate: '',
      finishDate: '',
      genre: '',
      notes: '',
      rating: 0,
      completed: false
    });
    setShowForm(false);
    
    // Add XP for adding a new book
    addXP(10, 'books');
  };

  const updateBookProgress = (id, newPage) => {
    // Validate the input
    const numericPage = parseInt(newPage) || 0;
    const book = books.find(b => b.id === id);
    
    if (book && numericPage >= 0 && numericPage <= book.totalPages) {
      const updatedBooks = books.map(book => {
        if (book.id === id) {
          return {
            ...book,
            currentPage: numericPage,
            completed: numericPage === parseInt(book.totalPages)
          };
        }
        return book;
      });
      
      setBooks(updatedBooks);
      setSelectedBook({
        ...selectedBook,
        currentPage: numericPage,
        completed: numericPage === parseInt(book.totalPages)
      });

      // Add XP for progress
      if (numericPage > book.currentPage) {
        addXP(5); // Add XP for making progress
      }
    }
  };

  const updateBookNotes = (id, notes) => {
    setBooks(prev => prev.map(book => {
      if (book.id === id) {
        return { ...book, notes };
      }
      return book;
    }));
  };

  const updateBookRating = (id, rating) => {
    setBooks(prev => prev.map(book => {
      if (book.id === id) {
        // If this is the first time rating or increasing the rating, award XP
        const oldRating = prev.find(b => b.id === id)?.rating || 0;
        if (rating > oldRating) {
          addXP(5, 'books');
        }
        
        return { ...book, rating: parseInt(rating) };
      }
      return book;
    }));
  };

  const deleteBook = (id) => {
    setBooks(prev => prev.filter(book => book.id !== id));
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook(null);
    }
  };

  const calculateProgress = (currentPage, totalPages) => {
    const current = parseInt(currentPage) || 0;
    const total = parseInt(totalPages) || 1; // Avoid division by zero
    return Math.min(Math.round((current / total) * 100), 100);
  };

  const calculateReadingStats = () => {
    const totalBooks = books.length;
    const completedBooks = books.filter(book => book.completed).length;
    const inProgressBooks = books.filter(book => !book.completed).length;
    
    const totalPages = books.reduce((sum, book) => sum + (parseInt(book.totalPages) || 0), 0);
    const readPages = books.reduce((sum, book) => sum + (parseInt(book.currentPage) || 0), 0);
    
    return {
      totalBooks,
      completedBooks,
      inProgressBooks,
      totalPages,
      readPages,
      completionRate: totalBooks ? Math.round((completedBooks / totalBooks) * 100) : 0
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredBooks = () => {
    switch (filter) {
      case 'reading':
        return books.filter(book => !book.completed);
      case 'completed':
        return books.filter(book => book.completed);
      default:
        return books;
    }
  };

  const stats = calculateReadingStats();

  return (
    <motion.div 
      className="books-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="books-header">
        <h1>Book Progression Tracker</h1>
        <p>Track your reading progress and earn XP</p>
      </div>

      <div className="books-stats">
        <div className="stat-card">
          <h3>Total Books</h3>
          <div className="stat-value">{stats.totalBooks}</div>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <div className="stat-value">{stats.completedBooks}</div>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <div className="stat-value">{stats.inProgressBooks}</div>
        </div>
        <div className="stat-card">
          <h3>Pages Read</h3>
          <div className="stat-value">{stats.readPages}/{stats.totalPages}</div>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <div className="stat-value">{stats.completionRate}%</div>
        </div>
      </div>

      <div className="books-content">
        <div className="books-list">
          <div className="books-list-header">
            <h2>Your Books</h2>
            <div className="books-filters">
              <button 
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={filter === 'reading' ? 'active' : ''}
                onClick={() => setFilter('reading')}
              >
                Reading
              </button>
              <button 
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
            <button 
              className="add-book-btn"
              onClick={() => {
                setShowForm(!showForm);
                setSelectedBook(null);
              }}
            >
              {showForm ? 'Cancel' : '+ Add Book'}
            </button>
          </div>

          {showForm && (
            <motion.form 
              className="book-form"
              onSubmit={addBook}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="title">Book Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newBook.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="author">Author</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={newBook.author}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="genre">Genre</label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    value={newBook.genre}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalPages">Total Pages</label>
                  <input
                    type="number"
                    id="totalPages"
                    name="totalPages"
                    value={newBook.totalPages}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currentPage">Current Page</label>
                  <input
                    type="number"
                    id="currentPage"
                    name="currentPage"
                    value={newBook.currentPage}
                    onChange={handleInputChange}
                    min="0"
                    max={newBook.totalPages || Infinity}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={newBook.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="finishDate">Finish Date</label>
                  <input
                    type="date"
                    id="finishDate"
                    name="finishDate"
                    value={newBook.finishDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn">Add Book</button>
            </motion.form>
          )}

          {filteredBooks().length > 0 ? (
            <div className="books-grid">
              {filteredBooks().map(book => (
                <motion.div 
                  key={book.id} 
                  className={`book-card ${book.completed ? 'completed' : ''} ${selectedBook && selectedBook.id === book.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBook(book)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="book-header">
                    <h3>{book.title}</h3>
                    {book.completed && <span className="completed-badge">Completed</span>}
                  </div>
                  
                  <div className="book-info">
                    {book.author && <p className="book-author">by {book.author}</p>}
                    {book.genre && <p className="book-genre">{book.genre}</p>}
                  </div>
                  
                  <div className="book-progress">
                    <div className="progress-label">
                      <span>Progress: {calculateProgress(book.currentPage, book.totalPages)}%</span>
                      <span>{book.currentPage}/{book.totalPages} pages</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${calculateProgress(book.currentPage, book.totalPages)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="book-dates">
                    <div className="date-item">
                      <span>Started:</span>
                      <span>{formatDate(book.startDate)}</span>
                    </div>
                    <div className="date-item">
                      <span>Finished:</span>
                      <span>{formatDate(book.finishDate)}</span>
                    </div>
                  </div>
                  
                  {book.rating > 0 && (
                    <div className="book-rating">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < book.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    className="delete-book-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBook(book.id);
                    }}
                  >
                    Delete
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-books">
              <p>No books found. Add your first book to start tracking!</p>
            </div>
          )}
        </div>

        {selectedBook && (
          <div className="book-details">
            <div className="book-details-header">
              <h2>{selectedBook.title}</h2>
              {selectedBook.author && <p className="book-author">by {selectedBook.author}</p>}
            </div>

            <div className="book-progress-update">
              <h3>Update Progress</h3>
              <div className="progress-controls">
                <div className="progress-input">
                  <input 
                    type="number"
                    value={selectedBook.currentPage || 0}
                    onChange={(e) => updateBookProgress(selectedBook.id, e.target.value)}
                    min="0"
                    max={selectedBook.totalPages}
                  />
                  <span>of {selectedBook.totalPages} pages</span>
                </div>
              </div>
              <div className="progress-percentage">
                {calculateProgress(selectedBook.currentPage, selectedBook.totalPages)}% Complete
              </div>
            </div>

            <div className="book-rating-section">
              <h3>Your Rating</h3>
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`star ${i < selectedBook.rating ? 'filled' : ''}`}
                    onClick={() => updateBookRating(selectedBook.id, i + 1)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="book-notes">
              <h3>Notes</h3>
              <textarea
                value={selectedBook.notes}
                onChange={(e) => updateBookNotes(selectedBook.id, e.target.value)}
                placeholder="Add your notes about this book..."
                rows="5"
              ></textarea>
            </div>

            <div className="book-metadata">
              <div className="metadata-item">
                <span>Genre:</span>
                <span>{selectedBook.genre || 'Not specified'}</span>
              </div>
              <div className="metadata-item">
                <span>Started:</span>
                <span>{formatDate(selectedBook.startDate)}</span>
              </div>
              <div className="metadata-item">
                <span>Finished:</span>
                <span>{formatDate(selectedBook.finishDate)}</span>
              </div>
              <div className="metadata-item">
                <span>Status:</span>
                <span className={selectedBook.completed ? 'completed-status' : 'reading-status'}>
                  {selectedBook.completed ? 'Completed' : 'Reading'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Books;