[] Trim data sent over the wire (confirm-track route)
[] ScrollRestoration for Track Tables

  # From girish.v on discord: 
  - Ah, *I'm not sure you can restore the scroll*. Because redirect will replace
    the current entry in the stack with the new location, it would be a new
    location. You'd have to *pass the scroll state as well, and when
    redirecting, set the scroll state in a cookie*, and read it from the
    previous location loader, and then inside useEffect check for the scroll
    location in the loader data, if a scroll position is there, scrollTo that
    position, else state at the top
  - Use window.scrollY and $Form.scrollTo to restore window scroll position
      - maybe commit and destroy cookies?

[] Refactor getPlaylistData (too slow)
[] Refactor table components (create consumer interface)
