NCD PHOTOGRAPHY CLUB: WEBSITE FILES
  assets/logo.png (header logo), assets/favicon.png (browser tab icon), assets/apple-touch-icon.png: replace these to change the logo.
===========================================

A plain website. Nothing to install or build.

PHOTOS ARE ORGANISED BY EVENT (the "folders" on Home and Photos)
  Home and the Photos page show one folder card per event (Eid Photo Walk, Workshop, ...).
  A visitor opens a folder to see only that event's photos, so nobody scrolls through thousands.
  Both pages use the same system, and every event has its own link, for example
  photos.html#e=eid-photo-walk-2026 .  The slideshow on Home shows the 6 newest photos overall.

ADD PHOTOS (GitHub Pages)
  Read HOW-TO-ADD-PHOTOS.txt. In short: make a folder named like "2026-10-18 Eid Photo Walk",
  put the photos inside, and drag the folder into assets/photos on github.com. Commit. Done.
  Each folder in assets/photos is one event folder on the Home and Photos pages.

HOST IT (keep the folder structure exactly as it is)
  Shared hosting:    upload everything into public_html with FTP or the file manager.
  Netlify Drop:      go to app.netlify.com/drop and drag the whole folder in.
  Cloudflare Pages:  Workers & Pages > Create > Pages > Upload assets.
  GitHub Pages:      put the files in a repository, then Settings > Pages.
  index.html must stay at the top level of the folder you publish.

FILES
  index.html        Home (slideshow of the newest photos + event folders)
  photos.html       The Photos page (all event folders)
  panel.html        The Panel page (heads and members). Do not edit it; see EDIT THE PANEL below.
  contact.html
  join.html         Application form (writes a message to copy and send)
  assets/css/style.css   All colours, fonts and layout
  assets/js/site.js      The scripts. The top of the file explains how photos are found.
  assets/js/events-data.js  Only needed with your own domain. See HOW-TO-ADD-PHOTOS.txt.
  assets/js/panel-data.js   THE PANEL TEXT LIVES HERE (names, positions, speeches, photo file names)
  assets/panel/          PANEL PHOTOS GO HERE (one image per person).
  assets/photos/         One folder per event lives here.
                         "2026-10-18-sample-event" is a sample: delete it on github.com once you have your own.

EDIT THE PANEL (add, remove or change people)
  1. Put the person's photo in  assets/panel/  (for example  president.jpg).
  2. Open  assets/js/panel-data.js  in a text editor. The top of the file explains it:
     copy a block to add a person, delete a block to remove one, change the words in quotes.
  3. Save and reload panel.html. Nothing else needs to change.
  With no photo file name, the person's initials are shown instead.

CHANGE THE WORDS
  Open any .html file in a text editor and edit the text between the tags.
  The club name, email (photoclub@example.com), Instagram (@openshutter.club),
  the numbers on the Home page are placeholders.
  The same footer appears on every page, so edit it in each file.

CHANGE THE COLOURS
  Open assets/css/style.css. The first block (":root") holds the colours.
  --accent is the blue. The block below it is the dark-mode version.

NOTES
  The Join form does not send anything. It writes an application message
  that the visitor copies and sends to you. To receive form submissions
  directly, connect the form to a service such as Formspree or Netlify Forms.
  Fonts load from Google Fonts, so pages need an internet connection to
  show the intended typefaces.
