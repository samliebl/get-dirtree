import fs from 'fs';
import path from 'path';

export function printDirectoryTree(directoryPath, style, outputPath, excludes) {
    // Ensure parameters have default values
    directoryPath = directoryPath || process.cwd(); // Default to current working directory
    style = ['default', 'backtick'].includes(style) ? style : 'default'; // Default to 'default' style
    excludes = excludes ? new RegExp(excludes.replace(".", "\\.")) : null; // Default to no exclusions
    outputPath = outputPath || null; // Default to null if not provided

    // Function to recursively generate the directory tree object
    function buildTree(currentPath) {
        const stats = fs.statSync(currentPath);
        const name = path.basename(currentPath);

        // Apply the exclusion pattern, if provided
        if (excludes && excludes.test(name)) {
            return null;
        }

        if (stats.isDirectory()) {
            const children = fs
                .readdirSync(currentPath)
                .map((child) => buildTree(path.join(currentPath, child)))
                .filter(Boolean); // Remove null entries (excluded files/folders)

            return { path: currentPath, name, children };
        }

        return { path: currentPath, name }; // Return file
    }

    // Function to generate the tree string with proper formatting
    function generateTreeString(tree, depth = 0, isLast = true, prefix = '') {
        let treeString = '';

        const isDirectory = tree.children && tree.children.length > 0;
        const name = isDirectory ? `${tree.name}/` : tree.name;

        // Add branch symbols based on style
        const branch =
            style === 'backtick'
                ? isLast
                    ? '`-- '
                    : '|-- '
                : '|-- '; // Default style uses '|-- ' for all items

        treeString += `${prefix}${branch}${name}\n`;

        if (tree.children) {
            const newPrefix = prefix + (isLast ? '    ' : '|   ');
            tree.children.forEach((child, index) => {
                const isLastChild = index === tree.children.length - 1;
                treeString += generateTreeString(child, depth + 1, isLastChild, newPrefix);
            });
        }

        return treeString;
    }

    // Build the tree structure starting from the given directory
    const tree = buildTree(directoryPath);
    if (!tree) {
        throw new Error('The directory could not be read or is empty.');
    }

    // Generate tree string starting from the root
    const treeString = `.\n${generateTreeString(tree)}`;

    if (outputPath) {
        // Ensure the output directory exists
        const distDir = path.resolve(outputPath);
        const distDirPath = path.dirname(distDir);
        if (!fs.existsSync(distDirPath)) {
            fs.mkdirSync(distDirPath, { recursive: true });
        }

        // Write the tree string to the specified output path
        fs.writeFileSync(outputPath, treeString);

        console.log(`
Directory tree printed to:
${outputPath}`);
    } else {
        // Print tree to console
        console.log(treeString);
    }
}
