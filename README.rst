Remote XUL (XUL through HTTP) has been removed from Firefox 4 (see `bug 546857`_ for more information). But there's still a whitelist that enables Remote XUL, which can be edited using this add-on.

**How to use on Desktop Firefox (and SeaMonkey)**

1. Click on the Firefox button on the top left, then select Web Developer, and finally Remote XUL Manager to open the management window. On Mac OS and some other systems, the menu item is accessible from Tools > Web Developer > Remote XUL Manager.
2. To add a domain, click on the Add button and then enter the domain name of the site you want to add to the list (*www.mozilla.org*, for example).
3. That's it! You should be able to access the site again without any problems.

**How to use on Mobile Firefox (version 1.1 and above)**

1. Enter *about:remotexul* in the address bar.
2. To add a domain, click on the Add button and then enter the domain name of the site you want to add to the list (*www.mozilla.org*, for example).
3. That's it! You should be able to access the site again without any problems.
4. It's recommended that you bookmark the Remote XUL page so that it's easy to come back to it.

**Advanced Features**

- A generator tool that creates an extension installer with a predefined whitelist. The generated extension doesn't require a restart to install, displays a warning message explaining what is happening, giving the user the option to cancel, and then removes itself.
- An import / export tool that uses simple text files for the whitelist. Files have a simple "one domain per line" format, using hashes (#) as the first character for commenting.

These features are not available on the mobile version, but you can install generated installers on Mobile Firefox.

The Installer sub-project holds all the source and Makefiles to build the Installer files independently from the main extension. It shouldn't be too much effort to migrate it to any other build system for custom deployments. 

.. _`bug 546857`: https://bugzilla.mozilla.org/show_bug.cgi?id=546857
