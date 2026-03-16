# Product Scope

This file exists to stop scope drift between the public site and the future authenticated app.

## Now

Current priority:

- public-facing homepage
- privacy policy
- clear product explanation
- trust and credibility for OAuth review
- clean frontend foundation for future product flows

## Next

Planned user portal flows:

- account creation
- connect Intervals
- goal setup and onboarding
- weekly plan
- calendar
- session detail

## Rule

Do not implement `Next` flows directly from backend assumptions alone.

Before any `Next` flow is implemented:

1. write the feature brief
2. create or update the mobile-first frame in `design/running-coach.pen`
3. validate the UX slice
4. only then implement FE
