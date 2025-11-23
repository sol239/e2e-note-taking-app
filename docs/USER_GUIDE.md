# User Guide

Welcome to the E2E Note-Taking App! This guide will help you get started and make the most of all the features.

## Table of Contents

- [Getting Started](#getting-started)
- [Account Management](#account-management)
- [Working with Notebooks](#working-with-notebooks)
- [Creating and Editing Content](#creating-and-editing-content)
- [Block Types Reference](#block-types-reference)
- [Security Features](#security-features)
- [Settings and Customization](#settings-and-customization)
- [Import and Export](#import-and-export)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [FAQ](#faq)

## Getting Started

### Creating Your Account

1. Navigate to the application homepage
2. Click **"Get Started"** or **"Register"**
3. Fill in the registration form:
   - **Email**: Your email address (used for login)
   - **Password**: Choose a strong password
   - **Nickname**: Display name (optional)
4. Click **"Register"**
5. You'll be automatically logged in and redirected to your notebooks

> **Note**: Your password is used to encrypt your master key. If you lose it, you won't be able to decrypt your notes. Make sure to set up recovery keys!

### First Login

1. Click **"Login"** from the homepage
2. Enter your email and password
3. If you have 2FA enabled, enter your 6-digit code
4. Click **"Login"**

You'll be taken to your notebooks page where you can start creating content.

## Account Management

### User Profile

Access your profile settings by clicking the **Settings** icon (gear) in the sidebar.

**Editable Fields:**
- **Nickname**: Your display name
- **First Name**: Optional
- **Last Name**: Optional

Changes are saved automatically when you click **"Save Changes"**.

### Password Change

1. Go to **Settings** → **Security** → **Password**
2. Enter your current password
3. Enter your new password
4. Confirm the new password
5. Click **"Change Password"**

> **Important**: Changing your password will re-encrypt your master key. Make sure you remember the new password!

### Account Deletion

To permanently delete your account:

1. Go to **Settings** → **Security** → **Delete Account**
2. Read the warning carefully
3. Enter your password to confirm
4. Click **"Delete My Account"**

> **Warning**: This action cannot be undone. All your notebooks and data will be permanently deleted.

## Working with Notebooks

### Creating a Notebook

1. From the **Notebooks** page, click **"+ New Notebook"**
2. Enter a name for your notebook
3. Click **"Create"**

Your new notebook will open automatically with a default heading block containing the notebook name.

### Opening a Notebook

Click on any notebook card from the Notebooks page. Recently opened notebooks appear at the top for quick access.

### Renaming a Notebook

1. Open the notebook
2. Click the **three-dot menu** (⋮) in the top-right corner
3. Select **"Rename"**
4. Enter the new name
5. Click **"Save"** or press Enter

### Deleting a Notebook

1. Open the notebook (or from notebooks list)
2. Click the **three-dot menu** (⋮)
3. Select **"Delete"**
4. Confirm the deletion

> **Warning**: Deleted notebooks cannot be recovered.

## Creating and Editing Content

### Understanding Blocks

Everything in a notebook is made up of **blocks**. Each block represents a single piece of content like a paragraph, heading, image, or code snippet.

### Adding Blocks

**Method 1: Using the Add Button**
- Click the **"+"** button that appears between blocks
- Select the block type from the menu

**Method 2: Using Keyboard**
- Press **Enter** at the end of a block to create a new paragraph block below
- Use the slash command `/` to see block type options (if implemented)

**Method 3: Converting Blocks**
- Click on a block to select it
- Use the block type dropdown to change its type

### Editing Block Content

1. **Click inside a block** to start editing
2. Type your content
3. Changes are saved automatically

### Moving Blocks

**Drag and Drop:**
1. Hover over a block until you see the drag handle (⋮⋮)
2. Click and hold the drag handle
3. Drag the block to its new position
4. Release to drop

### Deleting Blocks

1. Click on the block to select it
2. Press **Delete** or **Backspace** when the block is empty
3. Or use the block menu (⋮) → **Delete**

> **Note**: Some blocks (like the notebook title) cannot be deleted.

### Block Settings

Each block can have individual styling:

1. Click on a block to select it
2. Click the **settings icon** that appears
3. Adjust:
   - Font family and size
   - Text alignment
   - Colors (text, background, border)
   - Padding and spacing

## Block Types Reference

### Text Blocks

#### Paragraph
Standard text block for regular content. Supports rich text formatting.

#### Heading 1, 2, 3
Three levels of headings for organizing your content hierarchically.

- **Heading 1**: Main sections
- **Heading 2**: Subsections
- **Heading 3**: Sub-subsections

#### Quote
For highlighting quotations or important text. Displays with special styling.

#### Bulleted List
- Create unordered lists
- Great for non-sequential items
- Nested lists supported

#### Numbered List
1. Create ordered lists
2. Perfect for steps or rankings
3. Automatic numbering

#### Todo
- [ ] Create task lists
- [x] Check off completed items
- [ ] Stay organized

### Code Blocks

For displaying code with syntax highlighting:

1. Add a **Code** block
2. Select the programming language
3. Paste or type your code

```python
# Example Python code
def hello_world():
    print("Hello, World!")
```

Supported languages include Python, JavaScript, TypeScript, Java, C++, and many more.

### Math Blocks

Write mathematical equations using LaTeX/KaTeX syntax:

**Inline Math**: Use `$` for inline equations like $E = mc^2$

**Block Math**: Use block type for display equations:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### Media Blocks

#### Image
1. Add an **Image** block
2. Upload an image file or paste a URL
3. Add alt text for accessibility
4. Resize by dragging corners

Supported formats: JPG, PNG, GIF, WebP

#### Video
1. Add a **Video** block
2. Enter a video URL (YouTube, Vimeo, or direct link)
3. Adjust size as needed

#### Audio
1. Add an **Audio** block
2. Upload an audio file or provide a URL
3. Use the built-in player controls

### Grid Blocks

Organize content in multi-column layouts:

1. Add a **Grid** block
2. Choose number of columns
3. Add content to each grid cell
4. Each cell can contain any block type

### Notebook Links

Create links to other notebooks:

1. Add a **Notebook Link** block
2. Select the target notebook from your list
3. Click the link to navigate

Perfect for creating a wiki-style knowledge base!

### Divider

Add visual separation between sections with a horizontal line.

## Security Features

### End-to-End Encryption

All your notes are encrypted on your device before being sent to the server. Here's how it works:

1. **Master Key**: Generated when you create your account
2. **Encryption**: Notes encrypted with AES-GCM 256-bit encryption
3. **Key Derivation**: Your password derives the key using PBKDF2 (600,000 iterations)
4. **Zero-Knowledge**: The server never sees your unencrypted data

### Two-Factor Authentication (2FA)

Add an extra layer of security to your account:

#### Setting Up 2FA

1. Go to **Settings** → **Security** → **Two-Factor Authentication**
2. Click **"Setup 2FA"**
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code from your app
5. Click **"Enable 2FA"**
6. **Save your recovery keys** in a safe place!

#### Using 2FA

When logging in with 2FA enabled:
1. Enter your email and password
2. Enter the 6-digit code from your authenticator app
3. Click **"Login"**

#### Recovery Keys

Recovery keys let you access your account if you lose your authenticator device:

1. **Save them securely** when you enable 2FA
2. Each key can only be used once
3. Store them in a password manager or write them down
4. Keep them separate from your passwords

#### Disabling 2FA

1. Go to **Settings** → **Security** → **Two-Factor Authentication**
2. Enter your password
3. Enter a 2FA code from your authenticator app
4. Click **"Disable 2FA"**

### Best Practices

- ✅ Use a strong, unique password
- ✅ Enable two-factor authentication
- ✅ Save your recovery keys safely
- ✅ Don't share your password or 2FA codes
- ✅ Log out on shared computers
- ✅ Regularly review your security settings

## Settings and Customization

### Global Settings

Apply default styles to all blocks in all notebooks:

1. Go to **Settings** → **Editor Preferences**
2. Adjust global defaults:
   - Default font family
   - Default font size
   - Default text color
   - Default background color
   - Default line height
   - Default alignment

Changes apply to new blocks and blocks without custom settings.

### Block-Level Settings

Override global settings for individual blocks:

1. Select a block
2. Click the **settings icon**
3. Adjust settings specific to that block
4. Changes apply immediately

### Editor Preferences

Customize your editing experience:

- **Auto-save**: Enable/disable automatic saving
- **Default block type**: Choose what type new blocks should be
- **Keyboard shortcuts**: Customize shortcuts (if available)
- **Theme**: Light/dark mode preferences (if available)

## Import and Export

### Exporting Notebooks

Export your notebooks for backup or sharing:

1. Open a notebook
2. Click **Menu** (⋮) → **Export**
3. Choose export format:
   - **JSON**: Complete notebook data with all metadata
   - **Markdown**: Plain text format
   - **PDF**: Formatted document (if available)
4. Download the file

### Importing Notebooks

Import previously exported notebooks:

1. From the **Notebooks** page, click **"Import"**
2. Select a JSON export file
3. The notebook will be added to your collection
4. Open it to verify the import

> **Note**: Only JSON exports from this application are guaranteed to work. Markdown imports may have limited support.

### Backup Strategy

We recommend regularly exporting your important notebooks:

- Export weekly or monthly
- Store exports in multiple locations
- Keep at least 2 backup copies
- Test your backups by importing them

## Keyboard Shortcuts

Boost your productivity with keyboard shortcuts:

### General
- **Ctrl/Cmd + S**: Save (auto-save handles this, but still works)
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Escape**: Deselect current block

### Block Operations
- **Enter**: Create new paragraph below
- **Backspace**: Delete empty block
- **Tab**: Indent (for lists)
- **Shift + Tab**: Outdent (for lists)
- **Ctrl/Cmd + D**: Duplicate block
- **Ctrl/Cmd + Delete**: Delete block

### Text Formatting
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Ctrl/Cmd + K**: Insert link

### Navigation
- **Arrow Up/Down**: Move between blocks
- **Home**: Go to start of block
- **End**: Go to end of block
- **Ctrl/Cmd + Home**: Go to first block
- **Ctrl/Cmd + End**: Go to last block

> **Note**: Some shortcuts may vary depending on your browser and operating system.

## FAQ

### General Questions

**Q: Is my data secure?**  
A: Yes! All your notes are encrypted on your device before being sent to the server. The server never has access to your unencrypted data.

**Q: Can I access my notes from multiple devices?**  
A: Yes, as long as you log in with the same account. Your encrypted notes sync across all devices.

**Q: What happens if I forget my password?**  
A: Unfortunately, without your password, your encrypted notes cannot be decrypted. This is a security feature. Make sure to set up recovery keys and store them safely!

**Q: How do I share notebooks with others?**  
A: Notebook sharing is currently not available but is on the roadmap for future development.

### Technical Questions

**Q: What browsers are supported?**  
A: Modern versions of Chrome, Firefox, Safari, and Edge are supported. The app requires Web Crypto API support.

**Q: Can I use the app offline?**  
A: Limited offline support may be available, but full offline mode is planned for future releases.

**Q: How much storage do I have?**  
A: Storage limits depend on your server configuration. Contact your administrator for details.

**Q: Can I export all my notebooks at once?**  
A: Currently, notebooks must be exported individually. Bulk export is planned for a future release.

### Troubleshooting

**Q: I can't see my notebooks**  
A: Make sure you're logged in. If the problem persists, try refreshing the page or clearing your browser cache.

**Q: Changes aren't saving**  
A: Check your internet connection. The app requires an active connection to save changes to the server.

**Q: Images aren't loading**  
A: Verify the image URL is accessible or try re-uploading the image.

**Q: 2FA code isn't working**  
A: Ensure your device's time is synchronized correctly. TOTP codes are time-based and require accurate system time.

**Q: I lost my recovery keys**  
A: If you still have access to your account and 2FA device, you can regenerate recovery keys in Settings → Security.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [README](../README.md) for technical documentation
2. Review the [Testing Documentation](../TESTING.md) for known issues
3. Open an issue on GitHub with details about your problem
4. Check the API documentation at `/api/schema/swagger-ui/`

---

**Last Updated**: November 23, 2025  
**Version**: 1.0

For developer documentation, see the [README](../README.md).
