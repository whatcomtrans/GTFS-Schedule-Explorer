const myInitCallback = function() {
    if (document.readyState == 'complete') {
      // Document is ready when Search Element is initialized.
      //select the search box input
      let inputs = document.querySelectorAll('.gsc-input-box input');
      for (const element of inputs) {
        element.placeholder = "What can we help you find?";
      }
    } else {
      // Document is not ready yet, when Search Element is initialized.
      google.setOnLoadCallback(function() {
         // Render an element with both search box and search results in div with id 'test'.
         let inputs = document.querySelectorAll('.gsc-input-box input');
        for (const element of inputs) {
            element.placeholder = "What can we help you find?";
        }
      }, true);
    }
  };
  
  // Insert it before the Search Element code snippet so the global properties like parsetags and callback
  // are available when cse.js runs.
  window.__gcse = {
    parsetags: 'onload',
    initializationCallback: myInitCallback
  };