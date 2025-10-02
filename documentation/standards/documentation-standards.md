---
description: Attach if creating or dealing with creation of documentation.
globs: 
alwaysApply: false
---
- In the docs. Don't use Readme.md instead name of the file should correspond based on the title of the content.
- Follow this structure:

docs/
├── code-documentation/    # Technical documentation
│   ├── components/        # Component documentation
│   ├── services/          # Backend Re-usable Services
│   ├── api/               # API documentation
│   └── schema/            # System architecture
└── features/              # Feature documentation

- All business requirements goes to features.
- All technical specification goes to code-documentation.
- Use semantic versioning for documentation updates.
- Always update the web view of the documentation based on the structure of the documentation.