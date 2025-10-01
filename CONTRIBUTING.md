# Contributing to SkillBoard

Thank you for your interest in contributing to SkillBoard! We welcome contributions from the community and are pleased to have you join us.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, browser, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies** for both frontend and backend
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Update documentation** if necessary
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and submit a pull request

## 🛠️ Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Local Development

1. **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/SkillBoard.git
cd SkillBoard
```

2. **Install dependencies**
```bash
# Frontend
cd Frontend
npm install

# Backend
cd ../backend/leetcodebackend
npm install
```

3. **Set up environment variables**
```bash
# Copy example env files and update with your values
cp .env.example .env
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend/leetcodebackend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

## 📝 Coding Standards

### Frontend (React)

- Use functional components with hooks
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error handling
- Add meaningful comments for complex logic
- Use TypeScript where applicable

### Backend (Node.js)

- Follow RESTful API conventions
- Implement proper error handling
- Use async/await for asynchronous operations
- Add input validation
- Include appropriate logging
- Follow the existing code structure

### General Guidelines

- **Code formatting**: Use Prettier for consistent formatting
- **Linting**: Follow ESLint rules
- **Naming conventions**: Use camelCase for variables and functions, PascalCase for components
- **File organization**: Keep related files together and follow the existing structure
- **Comments**: Write clear, concise comments for complex logic

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
cd Frontend
npm test

# Backend tests
cd backend/leetcodebackend
npm test
```

### Writing Tests

- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include tests for error scenarios
- Ensure good test coverage

## 📋 Commit Guidelines

### Commit Message Format

```
type(scope): description

body (optional)

footer (optional)
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```bash
feat(analyzer): add LeetCode heatmap visualization
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
```

## 🔍 Code Review Process

1. **Automated checks**: All PRs must pass automated tests and linting
2. **Manual review**: Code will be reviewed by maintainers
3. **Feedback**: Address any feedback or requested changes
4. **Approval**: PR will be merged after approval

### Review Criteria

- Code quality and readability
- Adherence to coding standards
- Test coverage
- Documentation updates
- Performance impact
- Security considerations

## 🏷️ Issue Labels

- **bug**: Something isn't working
- **enhancement**: New feature or request
- **documentation**: Improvements or additions to documentation
- **good first issue**: Good for newcomers
- **help wanted**: Extra attention is needed
- **priority-high**: High priority issue
- **priority-low**: Low priority issue

## 🚀 Release Process

1. **Version bump**: Update version numbers in package.json files
2. **Changelog**: Update CHANGELOG.md with new features and fixes
3. **Testing**: Ensure all tests pass
4. **Deployment**: Deploy to staging and production environments
5. **Tag release**: Create a GitHub release with appropriate tags

## 📞 Getting Help

If you need help or have questions:

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Email**: Contact ayanpandit.dev@gmail.com
- **Documentation**: Check the project wiki

## 📄 License

By contributing to SkillBoard, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes for significant contributions

Thank you for contributing to SkillBoard! 🎉