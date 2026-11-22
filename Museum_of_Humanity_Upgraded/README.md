# Museum of Humanity — Upgraded Virtual Exhibition

## Project
Responsive, cinematic, dark-and-gold website for a five-room philosophy exhibition. Plain HTML, CSS, JavaScript. No framework or build step.

## Run locally
1. Extract this ZIP.
2. Open `index.html` in a browser, or use VS Code + Live Server.
3. Images are loaded from Unsplash URLs, so internet access is required for photography.

## Rooms
1. Human Person as Embodied Spirit
2. Freedom and Responsibility
3. Intersubjectivity
4. Society and Culture
5. The Filipino Philosophy

Each room includes a photographic hero, exhibit cards, quote, reflection activity, room journal, and video thumbnail area.

## Configure YouTube videos (important)
The project uses a room image as thumbnail until you add a YouTube ID. The room's "Find a video on YouTube" link opens a search page to help you choose a relevant, teacher-approved clip.

To configure playback:
1. Choose a video on YouTube and copy its video ID from the URL. Example: `https://www.youtube.com/watch?v=VIDEO_ID` — copy the part after `v=`.
2. Open `js/app.js`.
3. Find the room object and replace `videoId:""` with `videoId:"YOUR_ID"`.
4. The room will show a YouTube thumbnail and play the video in an in-site modal iframe.

Video search links are already set in each room object. Search results are not a guarantee of academic suitability; check clip content and duration with your teacher.

## Reflection saving
Room reflections and final reflection are saved in the visitor's browser localStorage. They are local to that browser/device and are not sent to a server.

## Deploy to Vercel
- Import the folder/repository into Vercel.
- Framework preset: Other.
- Build command: leave blank.
- Output directory: `.`.
- Deploy.

## Media
Photo backgrounds use remote Unsplash image URLs. Internet connection is needed; URLs may be changed if images are unavailable. Please check image licenses/attribution expectations for your class submission. No emoji art or SVG illustration assets are used as room visuals.

## Add your downloaded Room 1 video
1. Put the downloaded file inside `assets/videos/`.
2. Rename it to `room1.mp4` (or update the `localVideo` path in `js/app.js`).
3. Room 1 is configured to load `assets/videos/room1.mp4`.
4. Its video thumbnail uses the room photograph; pressing play opens the local MP4 inside the website.

The provided YouTube URL's video ID is `h22pRtmiHmM`, but because you downloaded the video, you do not need to embed this ID. Keep the video file in the project for deployment.


## Room 2 — Freedom and Responsibility
Room 2 displays only the first supplied YouTube video:
- https://youtu.be/SG3IBFZUhCY

The second Room 2 video has been removed. The room's three quotations and reflection remain unchanged.

## Room 3 — Intersubjectivity
- Theme: Genuine connection, respect, and empathy with our fellow human beings.
- Quote: “If you feel pain, you are alive. If you feel other people’s pain, you are a human being.”
- Reflection: Intersubjectivity means I recognize the dignity of every person. Even if we are different, I must listen, respect, and care for them sincerely.
- Video: https://youtu.be/vAJ6jDoePyY

## Room 4 — Society and Culture
- Theme: We grow and live together within our society and shared culture.
- Quote: “A people without the knowledge of their past history, origin and culture is like a tree without roots.” — Marcus Garvey
- Reflection: Society and culture shape who I am. Through our traditions and community, I learn to cooperate, share, and contribute to the good of everyone.
- Video: https://youtu.be/gSyX8E44gUM

### Optional local Room 2 video
The uploaded project ZIP did not contain a local Room 2 video file. If you have downloaded one, place the actual MP4 file at `assets/videos/room2.mp4`. Do not create an empty placeholder MP4; it must be the real video file. The supplied YouTube embeds work without this local file.


## Latest updates
- Room 1 now uses the supplied Ludwig Wittgenstein quotation and embeds YouTube video `h22pRtmiHmM`.
- Room 2 now includes a WATCH & LEARN explanation beside its video thumbnail.
- Room 5 now presents the themes bayanihan, pakikisama, and pagpapakatao, the two supplied quotations, the supplied reflection, and YouTube video `sCPPdMhPj1A`.
- Mobile hero artwork now scales to the screen width without cropping the image.


## Responsive and theme improvements
- The hero image now scales to the viewport and shows the full artwork on narrow screens.
- The hero quotation remains visible on mobile.
- Light mode uses higher-contrast text and coordinated warm surfaces across the page and modal content.
- Theme choice is saved in the browser and restored on reload.
- Mobile navigation reports its expanded state for assistive technology.
