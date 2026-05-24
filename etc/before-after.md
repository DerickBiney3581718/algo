The Three Golden Rules of Pseudo-Elements:
The content Property is Mandatory: A pseudo-element will refuse to render entirely if you don't declare the content: ""; property, even if it's just an empty string.

They are Inline by Default: They act like normal text spans. If you want to give them a width, height, or a custom block layout, you must explicitly change their display mode to display: block or display: inline-block.

They Cannot Self-Close: You cannot attach a ::before or ::after to tags that cannot hold content internally (like <img />, <input />, or <br />).
