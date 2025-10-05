# Trello Task Template for Software Development

## =Ë Task Card Structure

Use this template when creating tasks in Trello to ensure consistency and completeness across all development work.

---

## 1. **Card Title**
**Format:** `[TYPE] Brief, action-oriented description`

**Examples:**
- `[FEAT] Add employee attendance export to Excel`
- `[BUG] Fix login timeout on mobile devices`
- `[ENHANCEMENT] Improve dashboard loading performance`
- `[REFACTOR] Optimize database queries in HRIS module`

**Card Types:**
- `[FEAT]` - New feature
- `[BUG]` - Bug fix
- `[ENHANCEMENT]` - Improvement to existing feature
- `[REFACTOR]` - Code refactoring
- `[DOCS]` - Documentation
- `[TEST]` - Testing tasks
- `[CHORE]` - Maintenance/build tasks

---

## 2. **Description (User Story Format)**

### User Story
```
As a [type of user],
I want to [perform some action],
So that I can [achieve some goal/benefit].
```

**Example:**
```
As a HR Manager,
I want to export employee attendance records to Excel,
So that I can create monthly reports for management review.
```

### Context/Background
- Why is this task needed?
- What problem does it solve?
- Any relevant background information
- Links to related issues, discussions, or documentation

---

## 3. **Acceptance Criteria** 

Use the **Given/When/Then** format (Gherkin syntax):

```
Given [some context/precondition],
When [some action is performed],
Then [expected outcome should occur].
```

**Example:**
```
 Given I am logged in as an HR Manager,
   When I click the "Export to Excel" button on the attendance page,
   Then a downloadable Excel file should be generated with all attendance records.

 Given the Excel file is generated,
   When I open the file,
   Then it should contain columns: Employee Name, Date, Time In, Time Out, Status.

 Given there are more than 1000 records,
   When I export the data,
   Then the system should show a progress indicator.

 Given the export fails,
   When an error occurs,
   Then the user should see a clear error message.
```

**INVEST Criteria Check:**
- [ ] **Independent** - Can be developed standalone
- [ ] **Negotiable** - Details can be discussed
- [ ] **Valuable** - Provides clear user/business value
- [ ] **Estimable** - Effort can be estimated
- [ ] **Small** - Can be completed in one sprint
- [ ] **Testable** - Has clear acceptance criteria

---

## 4. **Technical Requirements** ='

### Frontend Changes
- Files to modify: `src/pages/...`
- Components to create/update
- API endpoints to integrate
- UI/UX considerations

### Backend Changes
- Endpoints to create/modify
- Database schema changes (if any)
- Business logic implementation
- Security considerations

### Database Changes
- [ ] Schema modifications required?
- [ ] Migration scripts needed?
- [ ] Data seeding required?

### Dependencies
- List any dependencies on other tasks/cards
- Third-party libraries needed
- External API integrations

### Performance Considerations
- Expected load/traffic
- Optimization requirements
- Caching strategy

### Security Considerations
- Authentication/Authorization requirements
- Data validation rules
- Sensitive data handling

---

## 5. **Definition of Done (DoD)** 

### Code Quality
- [ ] Code follows project style guide (SOLID principles)
- [ ] Code has been reviewed by at least one peer
- [ ] No code smells or technical debt introduced
- [ ] Import aliases used correctly (`@modules`, `@components`, etc.)
- [ ] Error handling implemented
- [ ] Logging added for critical operations

### Testing
- [ ] Unit tests written and passing (80% coverage minimum)
- [ ] Integration tests written (if applicable)
- [ ] E2E tests written in `/playwright-testing/` (headless mode)
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Cross-browser testing (if frontend)

### Documentation
- [ ] Code comments added for complex logic
- [ ] API documentation updated (if backend)
- [ ] User manual updated (if user-facing)
- [ ] CHANGELOG.md updated
- [ ] README updated (if applicable)

### Build & Deployment
- [ ] `yarn build` runs successfully
- [ ] No console errors or warnings
- [ ] No build warnings
- [ ] Environment variables documented (if new)
- [ ] Migration scripts tested (if database changes)

### Performance
- [ ] Page load time acceptable (<2s)
- [ ] API response time acceptable (<500ms)
- [ ] No memory leaks
- [ ] Bundle size impact checked (use `ANALYZE=true yarn build`)

### Security
- [ ] Input validation implemented
- [ ] XSS/SQL injection prevention verified
- [ ] Authentication/Authorization tested
- [ ] Sensitive data not exposed in logs/console

### UI/UX (if applicable)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Material Design 3 standards followed (flat design, no shadows)
- [ ] Dialogs lazy-loaded using `defineAsyncComponent`
- [ ] Accessibility standards met
- [ ] Loading states implemented
- [ ] Error states handled gracefully

### Version Control
- [ ] Branch follows naming convention (`feat/`, `enhancement/`, `bug/`)
- [ ] Commits follow conventional commit format
- [ ] Pull request created
- [ ] PR description includes testing instructions
- [ ] All CI/CD checks passing

---

## 6. **Labels** <÷

Assign appropriate labels:
- **Priority:** `High`, `Medium`, `Low`
- **Complexity:** `Easy`, `Medium`, `Hard`
- **Module:** `HRIS`, `CMS`, `Treasury`, `Assets`, etc.
- **Type:** `Frontend`, `Backend`, `Full-Stack`, `Database`
- **Sprint:** `Sprint-01`, `Sprint-02`, etc.

---

## 7. **Checklist** 

Use Trello checklists for sub-tasks:

**Example:**
```
Development Tasks:
 Create database migration
 Implement backend endpoint
 Add frontend component
 Write unit tests
 Write E2E tests
 Update documentation

Review Tasks:
 Code review completed
 QA testing completed
 Product owner approval
```

---

## 8. **Attachments** =Î

Include relevant files:
- Design mockups/wireframes
- API documentation
- Database schema diagrams
- Screenshots of expected behavior
- Related documents

---

## 9. **Additional Information**

### Due Date
- Set realistic deadlines based on complexity
- Account for code review and testing time

### Assignee
- Assign to appropriate team member(s)
- Tag reviewers in comments

### Dependencies
- Link to dependent cards
- Note any blockers

### Estimates
- Story points or time estimate
- Break down large tasks into smaller ones

---

## 10. **Comments Section** =¬

Use comments for:
- Progress updates
- Questions/clarifications
- Design decisions
- Links to related PRs/commits
- Testing notes
- Deployment status

**Comment Format:**
```
[DATE] Update: Brief description of progress
- Completed: List of completed items
- In Progress: Current work
- Blocked by: Any blockers
- Next steps: What's coming next
```

---

## =Ý Quick Reference Checklist

Before creating a task, ensure:
- [ ] Clear, descriptive title with type prefix
- [ ] User story written (As a... I want... So that...)
- [ ] Acceptance criteria defined (Given/When/Then)
- [ ] Technical requirements documented
- [ ] Definition of Done checklist added
- [ ] Appropriate labels assigned
- [ ] Complexity/effort estimated
- [ ] Dependencies identified
- [ ] Assignee added
- [ ] Due date set (if applicable)

---

## <¯ Best Practices

1. **Keep tasks small** - Should be completable in 1-3 days
2. **Be specific** - Avoid vague descriptions
3. **Think of edge cases** - Include error scenarios in acceptance criteria
4. **Update regularly** - Keep the card status current
5. **Link related work** - Connect to other cards, PRs, commits
6. **Document decisions** - Use comments to record important choices
7. **Test thoroughly** - Don't skip the Definition of Done
8. **Review before closing** - Ensure all checklist items completed

---

## =Ú Resources

- [User Story Best Practices](https://www.atlassian.com/agile/project-management/user-stories)
- [Acceptance Criteria Guide](https://www.altexsoft.com/blog/acceptance-criteria-purposes-formats-and-best-practices/)
- [Definition of Done Templates](https://vitlyoshin.com/blog/definition-of-done/)
- [INVEST Criteria](https://www.agilealliance.org/glossary/invest/)
- Project Documentation: `/documentation/`
- Testing Guide: `/playwright-testing/readme.md`

---

**Last Updated:** 2025-10-05
**Maintained By:** GEER Development Team
