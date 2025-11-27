# Tamer Educational Activities 🎓

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38B2AC.svg)](https://tailwindcss.com/)

> An interactive educational activities platform with 8 engaging template types, designed for educators to create custom learning experiences in minutes.

## ✨ Features

- 🎯 **8 Interactive Templates** - Multiple choice quizzes, drag & drop, pick many, content reveal panels, and more
- 🎨 **Beautiful UI** - Modern design with dark/light theme support
- 💾 **Auto-Save** - Firebase integration with localStorage fallback
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- 🔥 **No Backend Required** - Pure HTML/CSS/JavaScript with Firebase
- ⚡ **Instant Setup** - No build process, just open and use
- 🎭 **Play & Edit Modes** - Create content and test it immediately

## 🚀 Quick Start

### Option 1: Direct Use
1. Download `template_fix_complete.html`
2. Open in any modern browser
3. Start creating activities!

### Option 2: GitHub Pages (Live Demo)
Visit: [Your Live Demo URL] (after enabling GitHub Pages)

### Option 3: Clone and Customize
```bash
git clone https://github.com/Karan2907/Tamer-Educational-Activities.git
cd Tamer-Educational-Activities
# Open template_fix_complete.html in your browser
```

## 📚 Available Templates

| Template | Description | Best For |
|----------|-------------|----------|
| **Quiz (MCQ)** | Multiple choice questions | Assessments, knowledge checks |
| **True/False** | Binary statement validation | Quick concept verification |
| **Flash Cards** | Front/back flip cards | Memorization, vocabulary |
| **Match Up** | Drag & drop pairs | Relationships, definitions |
| **Content Reveal Panels** | Click-to-expand info cards | Nutrition facts, categorized info |
| **Mental Health Drag & Drop** | Symptom matching activity | Health education, awareness |
| **Pick Many Quiz** | Multi-select questions | Complex scenarios, multiple answers |
| **Info Card Display** | Visual information cards | Presentations, showcases |

## 🎨 Design Highlights

### Authentic Articulate Storyline Recreation
- ✅ Exact color schemes from original Storyline slides
- ✅ Precise border radii (5.32%, 16.67%)
- ✅ Authentic animations (0.75s swivel, fade, float)
- ✅ Raleway font family throughout
- ✅ Multi-state interactions with glow effects

### Color Palette
```css
Purple:  #9F76D7, #9F75D4
Orange:  #F2B565, #FD7505, #FF7300
Green:   #BCD659, #53C67F, #5DCA87
Red:     #F86263, #D11F31, #C81628
Blue:    #5EA2E3, #4a8bc2
```

## 🛠️ Technology Stack

- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Tailwind CSS v3 (CDN)
- **Backend:** Firebase (Firestore + Authentication)
- **Icons:** Font Awesome 6.4.0
- **Fonts:** Raleway (Google Fonts)

## 📖 Usage Guide

### Creating Your First Activity

1. **Open the application**
2. **Select a template** from the showcase section
3. **Switch to Edit Mode** using the toggle button
4. **Add your content:**
   - Questions, answers, or card content
   - Customize colors and text
   - Set correct answers
5. **Save to Firebase** with a unique Game ID
6. **Switch to Play Mode** to test
7. **Share** the Game ID with students

### Example: Creating a Quiz

```javascript
// Your quiz data structure
{
  template: "mcq",
  title: "World Capitals Quiz",
  questions: [
    {
      q: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctIndex: 2
    }
  ]
}
```

## 🔧 Firebase Setup

### Quick Setup (5 minutes)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create project "tamer-educational-activities"

2. **Enable Services**
   - **Authentication** → Enable Anonymous
   - **Firestore Database** → Create database

3. **Get Configuration**
   - Project Settings → Your apps → Web app
   - Copy config and update in HTML file

4. **Current Configuration** (Already set up)
   ```javascript
   projectId: "tamer-educational-activities"
   authDomain: "tamer-educational-activities.firebaseapp.com"
   ```

### Guest Mode Fallback
- If Firebase auth is disabled, app automatically uses localStorage
- No setup required
- Data persists locally
- Perfect for offline testing

## 📂 Project Structure

```
Tamer-Educational-Activities/
├── template_fix_complete.html      # Main application (2,342 lines)
├── README.md                        # This file
├── PUSH_TO_GITHUB.md               # Git deployment guide
├── NEW_TEMPLATES_DOCUMENTATION.md  # Template specifications
├── FIREBASE_AUTH_FIX.md            # Auth troubleshooting
├── QUICK_FIX_GUIDE.md              # Quick start reference
└── .gitignore                      # Git ignore rules
```

## 🎯 Use Cases

### For Educators
- Create custom quizzes and assessments
- Build interactive study materials
- Design engaging classroom activities
- Generate printable worksheets

### For Students
- Self-paced learning
- Interactive practice sessions
- Flashcard study aids
- Knowledge retention games

### For Trainers
- Employee onboarding materials
- Compliance training quizzes
- Skill assessment tools
- Interactive presentations

## 🌟 Key Features in Detail

### 1. Content Reveal Panels
- Purple background with colorful expandable panels
- Swivel animations (0.75s)
- Perfect for nutrition education, categorized information
- Based on Articulate Storyline slide 2

### 2. Mental Health Drag & Drop
- Interactive symptom matching
- Green drop zones with visual feedback
- Color-coded correct/incorrect states
- Educational and engaging

### 3. Pick Many Quiz
- Multi-select questions
- Blue parallelogram header with skew effect
- Hover glow effects (24px spread)
- Great for complex scenarios

### 4. Info Card Display
- Beautiful blue gradient backgrounds
- Float animations
- Color bars with labels
- Professional presentations

## 🔐 Data Privacy

- **Firebase Mode:** Data stored securely in Firestore
- **Guest Mode:** Data stored locally in browser
- **No Personal Info:** No email or password required
- **Anonymous Auth:** No tracking, completely private

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Design inspired by Articulate Storyline templates
- Color schemes and animations faithfully recreated from original XML files
- Built with modern web technologies for maximum compatibility

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Karan2907/Tamer-Educational-Activities/issues)
- **Documentation:** See `NEW_TEMPLATES_DOCUMENTATION.md`
- **Quick Start:** See `QUICK_FIX_GUIDE.md`

## 🚀 Roadmap

- [ ] Export to PDF functionality
- [ ] Print-friendly worksheets
- [ ] Audio/video integration
- [ ] Timer functionality
- [ ] Progress tracking
- [ ] Leaderboards
- [ ] More template types
- [ ] Mobile app version

## 📊 Stats

- **Templates:** 8 interactive types
- **Lines of Code:** 2,342
- **CSS Animations:** 3 (swivel, fade, float)
- **Color Palette:** 15+ carefully chosen colors
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)

## 🎓 Educational Value

This platform supports multiple learning styles:
- **Visual Learners:** Colorful cards, animations, visual feedback
- **Kinesthetic Learners:** Drag & drop, interactive elements
- **Reading/Writing Learners:** Text-based content, customizable
- **Auditory Learners:** (Future: audio integration planned)

---

**Made with ❤️ for educators and learners everywhere**

*Last updated: 2025*
