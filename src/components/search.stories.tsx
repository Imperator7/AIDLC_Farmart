import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { bestSellers, categories, topSaver, type SearchSuggestions } from "@/data/home";
import { suggestionOptions } from "@/lib/search";
import SearchBar, { SuggestionsPanel } from "./search-bar";
import { FilterChip, Pagination, SearchEmpty } from "./search-results";
import SortSelect from "./sort-select";

/** DESIGN.md: search-bar, search-suggestions, filter-chip, sort-select, pagination, search-empty. */
const meta = {
  title: "Components/Search",
  component: SuggestionsPanel,
  args: {
    id: "story-suggestions",
    query: "be",
    activeIndex: 0,
    options: suggestionOptions({
      query: "be",
      products: [bestSellers[1], topSaver[1], topSaver[0]].map(({ id, name, image, price }) => ({ id, name, image, price })),
      categories: [],
    }),
  },
  // The panel hangs off a stand-in search field, as under the real search-bar.
  decorators: [
    (Story) => (
      <div className="max-w-xl pb-80">
        <div className="relative h-10 rounded-md bg-gray-100">{Story()}</div>
      </div>
    ),
  ],
} satisfies Meta<typeof SuggestionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Products, then categories, then "Search for". The highlighted row has the amber-100 fill. */
export const Suggestions: Story = {};

export const WithCategory: Story = {
  args: {
    query: "milk",
    activeIndex: -1,
    options: suggestionOptions({ query: "milk", products: [], categories: [{ slug: "milks-dairies", name: "Milks & Dairies" }] }),
  },
};

/** No matches: a sentence, not an empty panel. */
export const NoMatches: Story = { args: { query: "zzz", options: [] } };

const mockSuggestions: SearchSuggestions = {
  query: "be",
  products: [bestSellers[1], topSaver[1]].map(({ id, name, image, price }) => ({ id, name, image, price })),
  categories: [],
};

/** The real search bar with the API mocked: type, arrow down, Escape. */
export const LiveSearchBar: Story = {
  beforeEach: () => {
    const original = window.fetch;
    window.fetch = async () => Response.json(mockSuggestions);
    return () => {
      window.fetch = original;
    };
  },
  render: () => <SearchBar variant="desktop" categories={categories} className="flex" />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Search products" });
    await userEvent.type(input, "be");
    // Scoped to the listbox: the category <select> has options too.
    const options = () => within(canvas.getByRole("listbox")).getAllByRole("option");
    await waitFor(() => expect(options()).toHaveLength(3));
    await expect(input).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{ArrowDown}");
    await expect(options()[0]).toHaveAttribute("aria-selected", "true");
    await expect(input.getAttribute("aria-activedescendant")).toBe(options()[0].id);

    await userEvent.keyboard("{Escape}");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
  },
};

/** filter-chip: amber with a check when on. */
export const FilterChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <FilterChip href="#">All categories</FilterChip>
      <FilterChip href="#" active>
        Raw Meats
      </FilterChip>
      <FilterChip href="#">Pet Foods</FilterChip>
      <FilterChip href="#">On sale</FilterChip>
    </div>
  ),
};

export const Sort: Story = { render: () => <SortSelect value="price_asc" params={{ q: "beef" }} /> };

/** "Best match" needs a query; without one the first option reads "Best selling". */
export const SortWithoutQuery: Story = { render: () => <SortSelect value="relevance" params={{}} /> };

export const Paging: Story = {
  render: () => <Pagination page={2} totalPages={3} hrefFor={(p) => `#page-${p}`} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "#page-1");
    await expect(canvas.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "#page-3");
  },
};

/** First page: Previous stays in place, disabled. */
export const PagingFirstPage: Story = { render: () => <Pagination page={1} totalPages={3} hrefFor={(p) => `#page-${p}`} /> };

export const Empty: Story = {
  globals: { backgrounds: { value: "soft" } },
  render: () => <SearchEmpty query="zzz" clearHref="#" />,
};
