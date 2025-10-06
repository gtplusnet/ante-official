# Review Trello Task & PR

Automated workflow to review pull requests in QA Review and move to Done when merged.

## Trello Board Configuration

### Board Lists (IDs)
- **To Do**: 68de5fcf7534f0085373f7f0
- **In Progress**: 68de5fd2323f4388c651cdef
- **QA Review**: 68de606c8035e07e7dcd094c
- **Done**: 68de5fd51be89a62a492b228

### Labels
- **Rejected**: Red label for rejected PRs (create if doesn't exist)
- **Needs Revision**: Yellow label for changes requested

## Instructions

### Step 1: Find Cards in QA Review
1. Fetch all cards from "QA Review" list (ID: 68de606c8035e07e7dcd094c)
2. Display available cards with:
   - Card name
   - Branch name (from description)
   - PR link (from description)
   - Priority
   - Due date (if any)
3. If no cards in QA Review:
   - Inform user
   - Suggest checking other lists
   - Exit

### Step 2: Select Card to Review
1. If only one card, select it automatically
2. If multiple cards, ask user which one to review
3. Extract PR URL from card description

### Step 3: Check PR Status
1. Get PR details using GitHub CLI:
   ```bash
   gh pr view [PR-number] --json state,mergeable,isDraft,reviews,checks
   ```
2. Display PR status:
   - State (open/closed/merged)
   - Draft status
   - Review status
   - CI/CD checks status
3. If PR is already merged:
   - Skip to Step 8 (Move to Done)
   - Exit

### Step 4: Code Review - Check Coding Guidelines

Review the PR changes against project standards:

#### A. General Coding Standards
- [ ] Clear, consistent naming conventions
- [ ] Code is clean, maintainable, and well-documented
- [ ] Follows existing project structure and patterns
- [ ] Comments added where logic is not obvious
- [ ] Readability prioritized over cleverness

#### B. SOLID Principles Check
Verify adherence to SOLID principles:

**Single Responsibility Principle (SRP)**
- [ ] Each class/module has one reason to change
- [ ] Functions do one thing and do it well
- [ ] Services are focused on a single domain

**Open/Closed Principle (OCP)**
- [ ] Code is open for extension, closed for modification
- [ ] Uses interfaces and abstract classes appropriately
- [ ] Plugin/strategy patterns used where applicable

**Liskov Substitution Principle (LSP)**
- [ ] Derived classes can substitute base classes
- [ ] Interface implementations are complete and correct
- [ ] No unexpected behavior in subclasses

**Interface Segregation Principle (ISP)**
- [ ] Interfaces are small and focused
- [ ] No fat interfaces forcing unnecessary implementations
- [ ] Clients depend only on methods they use

**Dependency Inversion Principle (DIP)**
- [ ] Depend on abstractions, not concretions
- [ ] High-level modules don't depend on low-level modules
- [ ] Both depend on abstractions (interfaces)

#### C. Backend Standards (if applicable)
- [ ] CommonModule imported in feature modules
- [ ] Controllers use DTO classes with class-validator
- [ ] DTOs implement interfaces from @shared/request
- [ ] Services use interfaces from @shared/response
- [ ] Uses `this.utilityService.responseHandler` for responses
- [ ] Proper error handling with HTTP exceptions
- [ ] Path aliases used (@common, @modules, @shared, etc.)
- [ ] Unit tests written for services
- [ ] Integration tests written for controllers

#### D. Frontend Standards (if applicable)
- [ ] Components follow Vue 3 Composition API (preferred) or Options API
- [ ] Dialogs use lazy loading (defineAsyncComponent)
- [ ] Material Design 3 standards followed (flat design, no shadows)
- [ ] Proper use of Pinia stores
- [ ] TypeScript types properly defined
- [ ] No console.log statements in production code
- [ ] Responsive design considered
- [ ] Accessibility attributes added (aria-label, etc.)

#### E. Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Proper indentation and formatting
- [ ] Meaningful variable and function names
- [ ] No hardcoded values (use constants/config)
- [ ] No commented-out code (remove before merge)

Use GitHub CLI to review the code:
```bash
gh pr diff [PR-number]
```

### Step 5: Verify Acceptance Criteria

1. Get acceptance criteria from Trello card description
2. Check each criterion against PR changes
3. Ask user to confirm each criterion is met
4. Document any unmet criteria

### Step 6: Run Tests (if applicable)

Determine test type based on changes:

#### A. Backend Changes
```bash
# Navigate to backend
cd backend

# Run unit tests
yarn test

# Run specific test file if applicable
yarn test [service-name].service.spec.ts
```

#### B. Frontend Changes
```bash
# Navigate to frontend
cd frontends/frontend-main

# Run build to check for errors
yarn build

# Run Playwright tests (ALWAYS HEADLESS)
yarn test

# Run specific test if applicable
playwright test [test-name].spec.ts
```

**CRITICAL**: Never use --headed or --ui flags with Playwright

#### C. E2E Testing Checklist
If PR involves UI changes, verify:
- [ ] Page loads without errors
- [ ] All interactive elements work (buttons, forms, etc.)
- [ ] Form validation works correctly
- [ ] Data displays correctly
- [ ] No console errors in browser
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Loading states work properly
- [ ] Error states display correctly

#### D. Manual Testing Steps
Create a manual testing checklist based on the changes:
1. Start the application
2. Navigate to affected pages/features
3. Test all acceptance criteria
4. Test edge cases
5. Test error scenarios
6. Verify no regression in related features

Document test results in a comment.

### Step 7: Review Summary

Create a review summary comment with:

```markdown
## QA Review Summary

**Reviewer**: @[username]
**Date**: [current-date]
**PR**: [PR-URL]

### Code Review
- [ ] Coding standards met
- [ ] SOLID principles followed
- [ ] No TypeScript/ESLint errors
- [ ] Proper documentation

### Testing
- [ ] Unit tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Performance acceptable

### Acceptance Criteria
- [ ] All criteria met
- [ ] Edge cases handled
- [ ] Error scenarios covered

### Issues Found
[List any issues or none]

### Recommendation
- [ ] ✅ Approve and merge
- [ ] ⚠️ Request changes
- [ ] ❌ Reject

### Notes
[Additional notes]
```

Add this summary as:
1. Comment on GitHub PR
2. Comment on Trello card

### Step 8: Handle Review Outcome

#### If Approved (all checks pass):
1. Post review summary as comment on PR:
   ```bash
   gh pr comment [PR-number] --body "[Review summary]"
   ```
2. Ask user: "Ready to merge PR?"
3. If yes:
   ```bash
   # Try to approve PR (will fail if reviewing your own PR)
   gh pr review [PR-number] --approve --body "[Review summary]" 2>/dev/null || true

   # Merge PR (squash and merge)
   # Note: Approval not required if repository doesn't have branch protection
   # IMPORTANT: Never use --delete-branch flag (keep source branch)
   gh pr merge [PR-number] --squash
   ```
4. Proceed to Step 9

**Note**: GitHub doesn't allow approving your own PR. However, you can still merge without approval if the repository settings don't require it (no branch protection rules). Source branches are preserved for reference.

#### If Changes Requested:
1. Add review comment to PR:
   ```bash
   gh pr review [PR-number] --request-changes --body "[Issues found]"
   ```
2. Add detailed comment to Trello card:
   ```markdown
   ⚠️ **Changes Requested**

   **Reviewed on**: [date]
   **Reviewer**: @[username]

   ## Issues to Address

   ### Code Quality
   - [Issue 1]
   - [Issue 2]

   ### Testing
   - [Issue 1]
   - [Issue 2]

   ## Next Steps
   - Address the issues above
   - Push changes to the same branch
   - Notify reviewer when ready for re-review
   ```
3. Add "Needs Revision" label to card (create if doesn't exist)
4. Keep card in "QA Review"
5. Exit

#### If Rejected:
1. Add review comment to PR with detailed issues:
   ```bash
   gh pr review [PR-number] --request-changes --body "[Detailed rejection reasons]"
   ```
2. Close PR:
   ```bash
   gh pr close [PR-number]
   ```
3. Add detailed rejection comment to Trello card:
   ```markdown
   ❌ **PR Rejected**

   **Reviewed on**: [date]
   **Reviewer**: @[username]
   **PR**: [PR-URL]

   ## Rejection Reasons

   ### Code Quality Issues
   - [List specific coding standard violations]
   - [SOLID principle violations if any]
   - [TypeScript/ESLint errors]

   ### Testing Issues
   - [Test failures]
   - [Missing tests]
   - [Manual testing issues]

   ### Acceptance Criteria
   - [Unmet criteria]
   - [Edge cases not handled]
   - [Missing features]

   ### Required Actions
   1. [Action item 1]
   2. [Action item 2]
   3. [Action item 3]

   ## Next Steps
   - Fix all issues listed above
   - Run tests locally and verify they pass
   - Re-submit for review when ready
   ```
4. Add "Rejected" label to card (create label if it doesn't exist)
5. Move card back to "To Do" (ID: 68de5fcf7534f0085373f7f0)
6. Remove PR link from card description
7. Exit

### Step 9: Move Card to Done (Only if PR Merged)

1. Verify PR is merged:
   ```bash
   gh pr view [PR-number] --json state,mergedAt
   ```
2. Update Trello card description to mark as completed:
   ```markdown
   ## Development Info
   Branch: [branch-name]
   Developer: @[username]
   Started: [start-date]
   PR: [PR-URL]
   Merged: [merge-date] ✅
   ```
3. Add completion comment:
   ```
   ✅ **Task Completed**

   PR merged: [PR-URL]
   Merged on: [merge-date]
   Reviewed by: @[reviewer]

   All acceptance criteria met and tests passing.
   ```
4. Move card from "QA Review" → "Done" (ID: 68de5fd51be89a62a492b228)

### Step 10: Cleanup & Summary

Display summary to user:
```
✅ Review completed successfully!

Card: [Card Name]
PR: [PR-URL]
Status: Merged and moved to Done

Summary:
- Code review: ✅ Passed
- Tests: ✅ Passing
- Acceptance criteria: ✅ All met
- Card status: Done

Next steps:
1. Notify team of completion
2. Update project documentation if needed
3. Monitor for any post-merge issues
```

## SOLID Principles Reference

### Single Responsibility Principle (SRP)
> A class should have one, and only one, reason to change.

**Good Example**:
```typescript
// Good: Separate responsibilities
class UserService {
  async createUser(data: CreateUserDto) { }
}

class EmailService {
  async sendWelcomeEmail(user: User) { }
}

class UserController {
  constructor(
    private userService: UserService,
    private emailService: EmailService
  ) {}

  async register(@Body() data: CreateUserDto) {
    const user = await this.userService.createUser(data);
    await this.emailService.sendWelcomeEmail(user);
    return user;
  }
}
```

**Bad Example**:
```typescript
// Bad: Multiple responsibilities in one class
class UserService {
  async createUser(data: CreateUserDto) {
    // User creation logic
    // Email sending logic
    // Logging logic
    // Notification logic
  }
}
```

### Open/Closed Principle (OCP)
> Software entities should be open for extension, closed for modification.

**Good Example**:
```typescript
// Good: Using strategy pattern
interface PaymentProcessor {
  process(amount: number): Promise<void>;
}

class CreditCardProcessor implements PaymentProcessor {
  async process(amount: number) { }
}

class PayPalProcessor implements PaymentProcessor {
  async process(amount: number) { }
}

class PaymentService {
  constructor(private processor: PaymentProcessor) {}

  async pay(amount: number) {
    await this.processor.process(amount);
  }
}
```

### Liskov Substitution Principle (LSP)
> Derived classes must be substitutable for their base classes.

**Good Example**:
```typescript
// Good: Derived class can substitute base class
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  area() { return this.side * this.side; }
}
```

### Interface Segregation Principle (ISP)
> Clients should not be forced to depend on interfaces they don't use.

**Good Example**:
```typescript
// Good: Small, focused interfaces
interface Readable {
  read(): string;
}

interface Writable {
  write(data: string): void;
}

class FileService implements Readable, Writable {
  read() { return 'data'; }
  write(data: string) { }
}

class LogService implements Writable {
  write(data: string) { } // Only implements what it needs
}
```

### Dependency Inversion Principle (DIP)
> Depend on abstractions, not concretions.

**Good Example**:
```typescript
// Good: Depend on abstraction
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) { console.log(message); }
}

class FileLogger implements Logger {
  log(message: string) { /* write to file */ }
}

class UserService {
  constructor(private logger: Logger) {} // Depends on abstraction

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating user');
    // ...
  }
}
```

## Documentation References

**Coding Standards**:
- `/documentation/standards/general-coding-standards.md`
- `/documentation/standards/backend-coding-standards.md`
- `/documentation/standards/controller-patterns.md`
- `/documentation/standards/service-patterns.md`
- `/documentation/standards/api-response-patterns.md`
- `/documentation/standards/material-design-3-standards.md`

**Testing**:
- `/documentation/testing/testing-guidelines.md`
- `/playwright-testing/readme.md`

**Architecture**:
- `/documentation/architecture/backend-structure-guide.md`
- `/documentation/architecture/frontend-architecture-guide.md`

## Error Handling

- If card not found in QA Review, suggest checking other lists
- If PR not found, provide manual review steps
- If tests fail, document failures and request changes
- If GitHub CLI not available, provide web URLs for manual review
- If Trello update fails, provide manual steps
- If label creation fails, note it in comment and continue with review
- If card cannot be moved between lists, provide manual move instructions

### Label Management
When adding labels to Trello cards:
1. Check if label exists on the board
2. If not, create the label with appropriate name and color:
   - "Rejected": Red color
   - "Needs Revision": Yellow color
3. Add label to the card
4. If label operations fail, continue review and note in comment

## Notes

- Always run tests in headless mode (never --headed or --ui)
- Document all findings in both PR and Trello card
- Be thorough but constructive in code review
- Focus on code quality, not perfection
- Verify SOLID principles are followed
- Ensure proper error handling and edge cases covered
