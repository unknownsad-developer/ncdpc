/* ==========================================================================
   PANEL PAGE: THIS IS THE FILE YOU EDIT
   --------------------------------------------------------------------------
   Everything on the Panel page comes from this file. No other file needs to change.

   ADD A MEMBER     Copy one whole block { ... }, including the comma after it,
                    and paste it where you want it to appear. The order here is
                    the order on the page (first block = first on the page).
   REMOVE A MEMBER  Delete the whole block { ... } and its comma.
   CHANGE A PHOTO   Put the image in the folder  assets/panel/  and write its
                    file name in "photo". Keep it lowercase, no spaces.
                    Leave "photo" empty ("") and the page shows the member's
                    initials instead.
   CHANGE TEXT      Edit the words between the quote marks. If you need a quote
                    mark inside the text, use ' (single) or write \" instead.
   HIDE A PART      Leave it empty (""): for example an empty "speech" shows no speech.

   Photo tip: square or portrait photos, about 800 pixels wide, look best.
   ========================================================================== */
window.PANEL_DATA = {

  // Words at the top of the page
  eyebrow: "Panel",
  title: "The people behind the shutter.",
  intro: "Meet the heads and members who plan our walks, run our critique nights and hang the yearly exhibition.",

  // Optional heading shown above each group. Set to "" to show no group headings.
  // Each member below says which group it belongs to with  group: "heads"  or  group: "members"
  groups: {
    heads:   "Club heads",
    members: "Members"
  },

  people: [

    {
      group: "heads",
      name: "Full Name",
      photo: "",                       // e.g. "president.jpg" (file in assets/panel/)
      position: "President",
      speech: "Replace this with the president's inspirational speech. Keep it as short or as long as you like."
    },

    {
      group: "heads",
      name: "Full Name",
      photo: "",
      position: "Vice President",
      speech: "Replace this with the vice president's inspirational speech."
    },

    {
      group: "heads",
      name: "Full Name",
      photo: "",
      position: "General Secretary",
      speech: "Replace this with the general secretary's inspirational speech."
    },

    {
      group: "members",
      name: "Full Name",
      photo: "",
      position: "Executive Member",
      speech: "Replace this with the member's own words."
    },

    {
      group: "members",
      name: "Full Name",
      photo: "",
      position: "Executive Member",
      speech: "Replace this with the member's own words."
    }

  ]
};
