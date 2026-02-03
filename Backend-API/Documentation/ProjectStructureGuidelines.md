# Smart Core Project Structure Guidelines

## ?? Module-Based Folder Organization Rule

**RULE: Every new module must have its own folder in each layer of the application.**

When creating a new module (e.g., `ExamModule`, `UserManagement`, `Reporting`), create a dedicated folder for that module in ALL relevant directories:

---

## ?? Standard Module Structure

For a new module called `{ModuleName}`, create the following folder structure:

```
Smart_Core/
??? Controllers/
?   ??? {ModuleName}/
?    ??? {ModuleName}Controller.cs
?
??? Application/
?   ??? DTOs/
?   ?   ??? {ModuleName}/
?   ???? {Entity1}Dtos.cs
?   ?       ??? {Entity2}Dtos.cs
?   ?    ??? ...
?   ?
?   ??? Interfaces/
?   ?   ??? {ModuleName}/
?   ?       ??? I{ModuleName}Service.cs
?   ?
?   ??? Validators/
?       ??? {ModuleName}/
?   ??? {Entity1}Validators.cs
?      ??? {Entity2}Validators.cs
?           ??? ...
?
??? Domain/
?   ??? Entities/
?   ?   ??? {ModuleName}/
?   ?  ??? {Entity1}.cs
?   ?       ??? {Entity2}.cs
?   ?       ??? ...
?   ?
?   ??? Enums/
?  ??? {ModuleName}Enums.cs (if applicable)
?
??? Infrastructure/
    ??? Data/
    ?   ??? Configurations/
    ?  ??? {ModuleName}/
    ?   ??? {Entity1}Configuration.cs
    ?           ??? {Entity2}Configuration.cs
    ?      ??? ...
    ?
    ??? Services/
        ??? {ModuleName}/
            ??? {ModuleName}Service.cs
```

---

## ?? Namespace Conventions

Each module folder should have its own sub-namespace:

| Layer | Namespace Pattern |
|-------|-------------------|
| Controllers | `Smart_Core.Controllers.{ModuleName}` |
| DTOs | `Smart_Core.Application.DTOs.{ModuleName}` |
| Interfaces | `Smart_Core.Application.Interfaces.{ModuleName}` |
| Validators | `Smart_Core.Application.Validators.{ModuleName}` |
| Entities | `Smart_Core.Domain.Entities.{ModuleName}` |
| Configurations | `Smart_Core.Infrastructure.Data.Configurations.{ModuleName}` |
| Services | `Smart_Core.Infrastructure.Services.{ModuleName}` |

---

## ? Existing Modules

### 1. Lookups Module
```
Controllers/Lookups/
Application/DTOs/Lookups/
Application/Interfaces/Lookups/
Application/Validators/Lookups/
Domain/Entities/Lookups/
Infrastructure/Data/Configurations/Lookups/
Infrastructure/Services/Lookups/
```

### 2. QuestionBank Module
```
Controllers/QuestionBank/
Application/DTOs/QuestionBank/
Application/Interfaces/QuestionBank/
Application/Validators/QuestionBank/
Domain/Entities/QuestionBank/
Infrastructure/Data/Configurations/QuestionBank/
Infrastructure/Services/QuestionBank/
```

---

## ?? Service Registration Pattern

When registering services in `Program.cs`, include the module namespace:

```csharp
using Smart_Core.Application.Interfaces.{ModuleName};
using Smart_Core.Infrastructure.Services.{ModuleName};

// Register module services
builder.Services.AddScoped<I{ModuleName}Service, {ModuleName}Service>();
```

---

## ?? Checklist for Creating a New Module

When adding a new module, ensure you create:

- [ ] `Controllers/{ModuleName}/{ModuleName}Controller.cs`
- [ ] `Application/DTOs/{ModuleName}/` (all DTO files)
- [ ] `Application/Interfaces/{ModuleName}/I{ModuleName}Service.cs`
- [ ] `Application/Validators/{ModuleName}/` (all validator files)
- [ ] `Domain/Entities/{ModuleName}/` (all entity files)
- [ ] `Infrastructure/Data/Configurations/{ModuleName}/` (all configuration files)
- [ ] `Infrastructure/Services/{ModuleName}/{ModuleName}Service.cs`
- [ ] Register service in `Program.cs`
- [ ] Add DbSet(s) to `ApplicationDbContext.cs`
- [ ] Create documentation in `Documentation/{ModuleName}Module.md`

---

## ?? Anti-Patterns to Avoid

1. **DON'T** put module files directly in layer folders without a module subfolder
   - ? `Controllers/LookupsController.cs`
   - ? `Controllers/Lookups/LookupsController.cs`

2. **DON'T** mix entities from different modules in the same folder
   - ? `Domain/Entities/Question.cs` + `Domain/Entities/QuestionCategory.cs`
   - ? `Domain/Entities/QuestionBank/Question.cs`
   - ? `Domain/Entities/Lookups/QuestionCategory.cs`

3. **DON'T** use inconsistent naming
   - ? `QuestionBankModule`, `question-bank`, `QuestionsBankService`
   - ? `QuestionBank` (consistent PascalCase everywhere)

---

## ?? Benefits of This Structure

1. **Discoverability** - Easy to find all files related to a specific feature
2. **Maintainability** - Changes to a module are isolated
3. **Scalability** - New modules can be added without cluttering existing folders
4. **Team Collaboration** - Different team members can work on different modules
5. **Potential Microservices** - Modules can be extracted into separate services if needed
