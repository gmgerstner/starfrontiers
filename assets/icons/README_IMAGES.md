Place your system images here:

- starfrontiers-logo.png
  - Purpose: small square icon used in the Foundry systems list and module manager.
  - Recommended size: 128x128 or 256x256 PNG (square). Keep file size small (~ <200 KB).

- starfrontiers-banner.png
  - Purpose: wide banner displayed in the systems/modules listing and module details.
  - Recommended size: 1024x256 (or similar 4:1 aspect ratio) PNG or JPG. Keep file size reasonable.

Naming and location
- Save the images exactly as `starfrontiers-logo.png` and `starfrontiers-banner.png` in this folder (`assets/icons/`).
- The `system.json` file references these paths as `assets/icons/starfrontiers-logo.png` and `assets/icons/starfrontiers-banner.png`.

Notes
- Foundry expects the `img` path in `system.json` to be relative to the root of the system folder when installed.
- When you create a release zip, ensure these files are included so the package manager shows your images correctly.
