<div align="center">
</div>

# Etymos: Trace the Ancestry of Your Thoughts

This project was born out of my recent obsession with Linguistics and the fascinating paths that words take through history. I found myself tracing the roots of everyday words back to Proto-Indo-European or Old Norse, and I realized that every word we speak is a relic of a bygone era, carrying centuries of culture, war, trade and poetry within its syllables. I wanted to visualize this, to see the "family tree" of a word, not just read about it. And thus, Etymos was born.

## What is Etymos?

Etymos is an interactive visualization tool that allows you to explore the etymology of words. By leveraging the power of Generative AI (Google Gemini), it dynamically constructs the lineage of any word you search for, presenting it in a variety of beautiful, interactive formats. Whether you want to see a word's roots as a botanical tree, a timeline of its evolution, or a complex network of connections, Etymos brings the history of language to life.

## Who is this for?

*   **Linguists & Philologists:** Visualize relationships and language families in a way that static text cannot convey.
*   **Writers & Poets:** Find inspiration by understanding the deeper meanings and historical contexts of the words you choose.
*   **Students & Educators:** Make learning about language history engaging and interactive.
*   **The Curiously Obsessed:** For anyone who has ever wondered why "night" looks like "Nacht" or "nuit", or how "galaxy" relates to "milk".

## Features & Visualizations

Etymos offers a diverse set of ways to view word histories:

*   **Botanical Tree:** A classic tree structure showing the root at the bottom and descendants branching upwards.
*   **Flowchart:** A clear, directional view of how one word led to another.
*   **Fishbone:** Good for seeing the direct "spine" of a word's history with contributing factors.
*   **Chronological Line:** A timeline view placing the word's evolution against the backdrop of history.
*   **Radial Tree & Sunburst:** Circular visualizations that are great for seeing the spread of a root into many languages.
*   **Hierarchical Edge Bundling & Force Directed Graph:** For seeing complex interconnections and "webs" of influence.
*   **Sankey Diagram:** Visualizes the flow of language transfer.
*   **Treemap & Circle Packing:** Nested views to see the relative dominance of certain linguistic roots.
*   **Manuscript (List View):** A clean, readable list for when you just want the data.

**Additional Features:**
*   **Export:** Save your visualizations as PNG, SVG, PDF, or JPEG.
*   **Dark Mode:** A toggle for late-night etymology diving.
*   **Tooltip Variants:** Choose between a modern or "manuscript" style for detailed info.
*   **Garden:** Save and revisit your favorite words.

## Usage Guide

1.  **Plant a Seed:** Type a word into the search bar on the home page and press Enter or click the "Bloom" button.
2.  **Explore:** Once the data loads, use the visualization switcher to see different perspectives of the word's history.
3.  **Interact:** Hover over nodes to see detailed information about the word in that specific language/era, including its meaning and context.
4.  **Customize:** Toggle Dark Mode or Full Screen for a more immersive experience.
5.  **Export:** Found a beautiful tree? Click the "Export" button to save it.

## Run Locally

**Prerequisites:** Node.js

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables:
    *   Create a `.env.local` file in the root directory.
    *   Add your Gemini API key:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```
4.  Run the app:
    ```bash
    npm run dev
    ```
5.  Open your browser to the local server address (usually `http://localhost:3000`).

---

*trace the ancestry of your thoughts.*
