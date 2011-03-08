Remote XUL (XUL through HTTP) has been removed from Firefox 4 (see `bug 546857`_ for more information). But there's still a whitelist that allows remote XUL access on a per-domain level.
This extension adds a simple management window that allows you to add and remove domains from the whitelist. It can be accessed from the Tools menu or the Developer submenu in the main Application menu.
It also includes a couple of advanced features for those needing to deploy whitelists to more than one system:

- An import / export tool that uses simple text files for the whitelist. Files have a simple "one domain per line" format, using hashes (#) as the first character for commenting.
- A generator tool that creates an extension installer with a predefined whitelist. The generated extension doesn't require a restart to install, displays a warning message explaining what is happening, giving the user the option to cancel, and then removes itself.

The Installer sub-project holds all the source and Makefiles to build the Installer files independently from the main extension. It shouldn't be too much effort to migrate it to any other build system for custom deployments. 

.. _`bug 546857`: https://bugzilla.mozilla.org/show_bug.cgi?id=546857
