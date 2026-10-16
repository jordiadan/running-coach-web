# Landing and Login: photographic running publication

This is the replacement of the public design rejected by the user on 2026-10-16.
The previous serif headline, mountain windows, pill actions and generic 16px
entrances are superseded. Its earlier review verdict is historical and does not
approve this replacement. Scope remains `/`, `/login`, public-only components,
assets, regression tests and their design records. Portal, onboarding, privacy
and backend behavior are unchanged.

## Direction and evidence

The runner should recognize training before reading a product explanation.
Actual athlete photography, condensed athletic typography and a working example
week establish that connection. Login continues the same identity around one
task heading and one Google action, rather than a competing marketing slogan.

The surface contract records the original Impeccable seed `67ef75c1` and the
photographic publication candidate from its grounded list. This replacement
follows user rejection of the prior candidate, not a claimed fresh assigned roll.
Taste informs hierarchy, distinct section compositions and restraint; its image
and motion quotas do not override the requested experience.

Three independently generated design studies explored the hero, product section
and Login before implementation. They are local concept studies, not approved
pixel specifications or screenshots of the application. Production uses real
licensed photos. The actual hero photograph determines the right-hand text
placement; the plan study’s invented mountain backdrop and decorative bars were
discarded. No image-generation output ships as an app asset.

## Typography, photography and composition

Self-hosted Barlow Condensed 600, named RC Display in CSS, supplies the public
display voice. DM Sans remains the shared reading and control face. All four
existing palettes remain; public action and error contrast adjustments retain the
portal’s established approach. The track mark and first-run language connect
public pages to onboarding. Square actions and image edges belong to these
public pages; authenticated control geometry is unchanged.

Three real photographs replace the repeated landscape: Fitsum Admasu’s running
group leads the page, Filip Mroz’s runner accompanies session evidence, and Jakob
Owens’s track stride connects setup and Login. Sources, licenses, local origin
sidecars and the font’s OFL are recorded in `src/assets/public/README.md`. Footer
credits link to source images. These photographs are editorial context, never
Running Coach customers, endorsements or training results.

The desktop hero preserves the athletes and puts copy over a neutral contrast
scrim on the right. Mobile places the photograph above the title and action.
The illustrative week shows both weekday and session names at every width;
controls use seven columns on wide screens and four at narrower widths. Selecting
a day exposes prescribed effort, duration and notes without saving a schedule.
Four running days, strength and rest illustrate supported plan content. The
following image/content section explains one source, a race or general goal,
at least four running days, preferred long-run day and the resulting weekly plan.
The close repeats the same primary action, “Build my week.”

Login uses one heading, one Google action, a real stride image and unboxed
next-step guidance. On mobile its image becomes a 180px band. Session checking,
existing-session replacement redirect, OAuth pending, duplicate prevention and
recoverable errors remain covered. Google’s callback stays `${origin}/portal`.

## Motion

- The hero headline resolves line by line through a mask while the image opens
  with a short photographic shutter. Supporting copy settles more quietly.
- Each below-fold photograph starts its shutter only when reached; it no longer
  finishes off-screen during initial mount.
- A damped shared selection surface and brief content transition connect the
  chosen weekday to its actual illustrative session.
- Public links optionally use native same-document View Transitions to carry
  the photo and brand into Login. Route updates are synchronous inside the native
  callback; the incoming image decodes before its snapshot. Unsupported browsers,
  modified clicks and reduced motion retain ordinary link behavior.
- Reduced motion shows final title/photo states immediately, removes transitions
  and bypasses native route animation. No decorative looping animation is added.

## Browser critique and corrections

The fresh review of the rejected design returned **rebuild**, identifying the
asset mismatch, generic entrances, disconnected Login, weak mobile session
meaning and text-only story. The replacement was inspected at desktop, tablet
and mobile, including actual motion recordings.

The first replacement pass corrected the hero’s head crop and exposure. Its full
fresh review accepted the new creative direction and recorded motion, then
requested three fixes: current documentation/seed provenance, low-contrast hero
microcopy over the sky, and missing whitespace between source sentences on
mobile. The fixes replace obsolete documentation, add explicit whitespace and
use a neutral photographic scrim protecting the entire copy region while keeping
the athletes visible. Photo-pixel contrast is measured independently from token
contrast; source text must meet 4.5:1 and the large heading 3:1. The corrected copy
region measures at least 4.95:1 at 768, 1024, 1280 and 1440px. A final review
verified these three fixes against refreshed captures and returned **ship** for
that scoped correction batch.

## Validation and limits

- `npm test`: 169 tests across 14 files pass, including 13 public navigation/auth
  regressions and native-transition route coverage.
- Typecheck passes: `tsc --noEmit -p tsconfig.app.json`.
- Lint passes with nine existing Fast Refresh warnings. Production build passes
  with existing Browserslist-age and bundle-size warnings. No dependency or
  lockfile changes; the display font is a licensed local asset.
- Playwright checks both routes across four themes at 320, 390, 640, 768, 900,
  1024, 1280 and 1440px: 64 measurements without overflow, clipped headings,
  undersized weekday targets or sampled token-contrast failures.
- Google OAuth is intercepted at its network boundary to verify provider and
  same-origin `/portal` callback. No personal Google login or production training
  data is used; external account consent is not claimed as locally verified.
- Actual motion samples show distinct headline progression and photo shutter,
  with the below-fold image unchanged until reached. The native route transition
  becomes ready after image decode and completes normally. Reduced motion reports
  no native transitions and no running animations. Keyboard focus reaches Google
  with a visible outline.
- Taste source lint reports no failures or warnings. Narrow source comments
  explain the neutral photographic contrast scrim and `box-shadow: none`, which
  removes the shared button’s duplicate focus ring rather than adding a shadow.
  The font detector’s intentional-addition
  finding is resolved by normative documentation; no detector rule was suppressed.
- Four shipped WebPs have origin sidecars; the provenance scan reports zero
  missing records. Superseded mountain derivatives are deleted.

Actual rejected-version captures remain under ignored
`.design-experiment/landing-login/` with `rejected-` names. Replacement desktop,
mobile, tablet, representative themes and pending captures live under ignored
`.design-experiment/landing-login-v2/`; motion records and measurements are there
too. Captures use real app rendering and are not committed. The CLI lacks a
supported GitHub image attachment path; selected local evidence can be attached
manually. Concept images are never implementation evidence.

The replacement review is scoped creative/UX verification, not user-research
validation, an award, approval by the user or accessibility certification.
