# Google Maps API Setup Guide

To enable mapping features (like delivery tracking) in your e-commerce application, follow these steps to get a Google Maps API Key:

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. If you don't have a project, click the project dropdown at the top and select **"New Project"**.
3. Name your project (e.g., "E-commerce Delivery") and click **"Create"**.

## 2. Enable Required APIs
1. In the sidebar, go to **"APIs & Services" > "Library"**.
2. Search for and **Enable** the following APIs:
   - **Maps JavaScript API** (for displaying maps on the frontend)
   - **Geocoding API** (for converting addresses to coordinates)
   - **Geolocation API** (for finding the deliveryman's current location)
   - **Places API** (optional, for address autocomplete)

## 3. Create an API Key
1. Go to **"APIs & Services" > "Credentials"**.
2. Click **"+ CREATE CREDENTIALS"** and select **"API key"**.
3. Your new API key will be displayed. **Copy this key.**

## 4. Restrict Your API Key (Recommended)
> [!IMPORTANT]
> To prevent unauthorized use, you should restrict your key.

1. Click on your API key name to edit it.
2. Under **"Set an application restriction"**, choose **"Websites"**.
3. Add `http://localhost:5173/*` (for development) and your production domain.
4. Under **"API restrictions"**, select **"Restrict key"** and check the APIs you enabled in Step 2.

## 5. Add to Your Project
1. Open your backend `.env` file.
2. Update the variable:
   ```env
   GOOGLE_MAPS_API_KEY=your_copied_api_key_here
   ```
3. If you have a frontend `.env` (like `.env.local`), add it there as well if the frontend library requires it:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_copied_api_key_here
   ```

---
**Next Step**: Restart your servers after updating the `.env` file.
