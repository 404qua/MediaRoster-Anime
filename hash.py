import os
import hashlib
import subprocess
import shutil

srcDir = "."
buildDir = "./build"

filesToHash = {
    "css": [
        os.path.join(srcDir, "css", "style.css"),
        os.path.join(srcDir, "css", "icons.css"),
        os.path.join(srcDir, "css", "search.css"),
        os.path.join(srcDir, "css", "details.css"),
        os.path.join(srcDir, "css", "auth.css")
    ],
    "js": [
        os.path.join(srcDir, "js", "pages.js"),
        os.path.join(srcDir, "js", "router.js"),
        os.path.join(srcDir, "js", "components", "initializer.js"),
        os.path.join(srcDir, "js", "api.js"),
        os.path.join(srcDir, "js", "components", "UIs.js"),
        os.path.join(srcDir, "js", "components", "search.js"),
        os.path.join(srcDir, "js", "components", "details.js"),
        os.path.join(srcDir, "js", "components", "data.js"),
        os.path.join(srcDir, "js", "components", "auth.js"),
        os.path.join(srcDir, "js", "components", "profile.js"),
        os.path.join(srcDir, "js", "supabase.js")
    ],
    "others": [
        os.path.join(srcDir, "media", "jumpscare.mp3"),
        os.path.join(srcDir, "media", "jumpscare.webp"),
        os.path.join(srcDir, "media", "logo.webp"),
        os.path.join(srcDir, "media", "details-bg.webp"),
        os.path.join(srcDir, "media", "akame.webp"),
        os.path.join(srcDir, "media", "AOT.webp"),
        os.path.join(srcDir, "media", "AssaClass.webp"),
        os.path.join(srcDir, "media", "BGS.webp"),
        os.path.join(srcDir, "media", "DeathNote.webp"),
        os.path.join(srcDir, "media", "DuskMaiden.webp"),
        os.path.join(srcDir, "media", "eminance.webp"),
        os.path.join(srcDir, "media", "naruto.webp"),
        os.path.join(srcDir, "media", "ReZero.webp"),
        os.path.join(srcDir, "media", "slime.webp"),
        os.path.join(srcDir, "media", "konosuba.webp")
    ]
}

try:
    import jsmin
except ImportError:
    jsmin = None

try:
    import csscompressor
except ImportError:
    csscompressor = None

try:
    import minify_html
except ImportError:
    minify_html = None


def ensureDir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def minifyFile(src, dest):
    ext = os.path.splitext(src)[1].lower()
    ensureDir(dest)

    # Prefer Node tools
    terserBin = shutil.which("terser")
    cleanCssBin = (
        shutil.which("cleancss")
        or shutil.which("clean-css")
    )
    htmlMinBin = (
        shutil.which("html-minifier-terser")
        or shutil.which("html-minifier")
    )

    cmd = None

    if ext == ".js" and terserBin:
        cmd = [
            terserBin,
            src,
            "-o",
            dest,
            "--compress",
            "--mangle"
        ]

    elif ext == ".css" and cleanCssBin:
        cmd = [
            cleanCssBin,
            "-o",
            dest,
            src
        ]

    elif ext == ".html" and htmlMinBin:
        cmd = [
            htmlMinBin,
            "--collapse-whitespace",
            "--remove-comments",
            "--minify-css",
            "true",
            "--minify-js",
            "true",
            "-o",
            dest,
            src
        ]

    if cmd:
        try:
            toolName = os.path.basename(cmd[0])

            print(
                f"[NODE] {toolName}: "
                f"{os.path.relpath(src, srcDir)}"
            )

            subprocess.run(
                cmd,
                check=True,
                shell=(os.name == "nt")
            )

            return

        except Exception as e:
            print(
                f"[NODE FAILED] "
                f"{os.path.relpath(src, srcDir)}: {e}"
            )
        
    # Fallback to Python
    try:
        with open(
            src,
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as f:
            content = f.read()

        if ext == ".js" and jsmin:
            print(
                f"[PYTHON] jsmin: "
                f"{os.path.relpath(src, srcDir)}"
            )
            content = jsmin.jsmin(content)

        elif ext == ".css" and csscompressor:
            print(
                f"[PYTHON] csscompressor: "
                f"{os.path.relpath(src, srcDir)}"
            )
            content = csscompressor.compress(content)

        elif ext == ".html" and minify_html:
            print(
                f"[PYTHON] minify_html: "
                f"{os.path.relpath(src, srcDir)}"
            )
            content = minify_html.minify(
                content,
                minify_js=True,
                minify_css=True
            )

        else:
            raise RuntimeError(
                "No Python minifier available."
            )

        with open(dest, "w", encoding="utf-8") as f:
            f.write(content)

        return

    except Exception as e:
        print(
            f"[PYTHON FAILED] "
            f"{os.path.relpath(src, srcDir)}: {e}"
    )
    
    # Final fallback
    print(f"Copying {src} without minification.")
    shutil.copy2(src, dest)


def copyDir(src, dest):
    if not os.path.exists(src):
        return

    os.makedirs(dest, exist_ok=True)

    for entry in os.listdir(src):
        srcPath = os.path.join(src, entry)
        destPath = os.path.join(dest, entry)

        if os.path.isdir(srcPath):
            copyDir(srcPath, destPath)
        else:
            shutil.copy2(srcPath, destPath)


def minifyAll():
    print("🪄 Minifying...")

    for category in ["css", "js"]:
        for path in filesToHash[category]:
            relPath = os.path.relpath(path, srcDir)
            dest = os.path.join(buildDir, relPath)
            minifyFile(path, dest)

    for path in filesToHash["others"]:
        relPath = os.path.relpath(path, srcDir)
        dest = os.path.join(buildDir, relPath)
        ensureDir(dest)
        shutil.copy2(path, dest)

    copyDir(
        os.path.join(srcDir, "webfonts"),
        os.path.join(buildDir, "webfonts")
    )

    indexPath = os.path.join(srcDir, "index.html")
    if os.path.exists(indexPath):
        minifyFile(
            indexPath,
            os.path.join(buildDir, "index.html")
        )

    notFoundPath = os.path.join(srcDir, "404.html")
    if os.path.exists(notFoundPath):
        minifyFile(
            notFoundPath,
            os.path.join(buildDir, "404.html")
        )

    print("Minification done.")


def hashAndUpdateRefs():
    print("Hashing and updating references...")

    hashedMap = {}
    builtFilesToUpdate = []

    for category in ["css", "js"]:
        for path in filesToHash[category]:
            builtFile = os.path.join(
                buildDir,
                os.path.relpath(path, srcDir)
            )

            if not os.path.exists(builtFile):
                continue

            with open(builtFile, "rb") as f:
                content = f.read()

            digest = hashlib.md5(content).hexdigest()[:8]

            base, ext = os.path.splitext(
                os.path.basename(path)
            )

            newName = f"{base}.{digest}{ext}"
            newPath = os.path.join(
                os.path.dirname(builtFile),
                newName
            )

            os.rename(builtFile, newPath)

            hashedMap[f"{base}{ext}"] = newName

            if ext in (".js", ".html"):
                builtFilesToUpdate.append(newPath)

    indexFile = os.path.join(buildDir, "index.html")
    if os.path.exists(indexFile):
        builtFilesToUpdate.append(indexFile)

    notFoundFile = os.path.join(buildDir, "404.html")
    if os.path.exists(notFoundFile):
        builtFilesToUpdate.append(notFoundFile)

    for filePath in builtFilesToUpdate:
        with open(
            filePath,
            "r",
            encoding="utf-8"
        ) as f:
            text = f.read()

        hcaptchaApiUrl = "https://js.hcaptcha.com/1/api.js"
        hcaptchaApiPlaceholder = "__HCAPTCHA_URL__"
        text = text.replace(hcaptchaApiUrl, hcaptchaApiPlaceholder)

        for old, new in hashedMap.items():
            text = text.replace(old, new)

        text = text.replace(hcaptchaApiPlaceholder, hcaptchaApiUrl)

        with open(
            filePath,
            "w",
            encoding="utf-8"
        ) as f:
            f.write(text)

    print("Updated references in HTML and JS files.")
    print("Done.")


def main():
    if os.path.exists(buildDir):
        shutil.rmtree(buildDir)

    os.makedirs(buildDir, exist_ok=True)

    minifyAll()
    hashAndUpdateRefs()


if __name__ == "__main__":
    main()