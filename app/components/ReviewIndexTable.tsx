import {
  IndexTable,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  RangeSlider,
  Badge,
  useBreakpoints,
  Icon,
  Thumbnail,
  Button,
  InlineStack,
  InlineError,
  ActionList,
  Popover,
  Box,
  Card,
} from "@shopify/polaris";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import {
  CheckSmallIcon,
  ImageIcon,
  MenuHorizontalIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  StarFilledIcon,
  StarIcon,
  XSmallIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { Review } from "../models/schemas";
import { useFetcher } from "@remix-run/react";
import type { ActionData } from "../routes/_app.reviews/route";

interface IndexTableProps {
  data: Review[];
  thumbnails: Record<string, string>;
  customers: Record<
    string,
    {
      firstName: string;
      lastName: string;
      emailAddress: string;
    }
  >;
}

const ITEM_STRINGS = ["All", "Pending", "Approved", "Denied", "Spam"];


function ReviewIndexTable({ data: initialData, thumbnails, customers }: IndexTableProps) {
  // State to manage local data and error
  const [data, setData] = useState<Review[]>(initialData);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher<ActionData>();
  // Sorting
  type SortKey = "rating" | "submittedAt" | null;
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Tabs
  const tabs: TabProps[] = ITEM_STRINGS.map((item, index) => ({
    content: item,
    index,
    onAction: () => { },
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions: [],
  }));
  const [selected, setSelected] = useState(0);
  // Query search
  const [queryValue, setQueryValue] = useState("");
  const handleFiltersQueryChange = useCallback((value: string) => setQueryValue(value), []);

  // Filters
  const { mode, setMode } = useSetIndexFiltersMode();
  const [rating, setRating] = useState<[number, number] | undefined>(undefined);
  const handleRatingChange = useCallback((value: [number, number]) => setRating(value), []);
  const handleRatingRemove = useCallback(() => setRating(undefined), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    handleRatingRemove();
    handleQueryValueRemove();
  }, [handleRatingRemove, handleQueryValueRemove]);

  const filters = [
    {
      key: "rating",
      label: "Rating",
      filter: (
        <RangeSlider
          label="Rating is between"
          labelHidden
          value={rating || [1, 5]}
          prefix="rating"
          output
          min={1}
          max={5}
          step={1}
          onChange={handleRatingChange}
        />
      ),
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (rating) {
    const key = "rating";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, rating),
      onRemove: handleRatingRemove,
    });
  }
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data và sort
  const filteredData = useMemo(() => {
    const statusFilter = ITEM_STRINGS[selected].toLowerCase();
    let filtered = data;

    if (statusFilter !== "all") {
      filtered = data.filter((review) => review.status.toLowerCase() === statusFilter);
    }

    if (rating) {
      filtered = filtered.filter((review) => review.rating >= rating[0] && review.rating <= rating[1]);
    }

    if (queryValue) {
      const query = queryValue.toLowerCase();
      filtered = filtered.filter((review) => {
        const fullName = `${customers[review.authorId].firstName.toLowerCase()} ${customers[review.authorId].lastName.toLowerCase()}`;
        return (
          review.title.toLowerCase().includes(query) ||
          review.body.toLowerCase().includes(query) ||
          fullName.includes(query) ||
          customers[review.authorId].emailAddress.toLowerCase().includes(query)
        );
      });
    }

    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (sortKey === "submittedAt") {
          const dateA = new Date(aVal).getTime();
          const dateB = new Date(bVal).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return filtered;
  }, [data, selected, sortKey, sortDirection, customers, queryValue, rating]);

  // Pagination
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [selected, rating, queryValue]);

  const resourceName = {
    singular: "review",
    plural: "reviews",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(data);

  const bulkActions = [
    { content: "Approve", onAction: () => handleUpdateStatus(selectedResources, "approved") },
    { content: "Deny", onAction: () => handleUpdateStatus(selectedResources, "denied") },
    { content: "Mark as spam", onAction: () => handleUpdateStatus(selectedResources, "spam") },
  ];

  // Handle status update with useFetcher
  const handleUpdateStatus = useCallback(
    (reviewIds: string[], status: "approved" | "denied" | "spam") => {
      setError(null);
      setData((prevData) => prevData.map((review) => (reviewIds.includes(review.id) ? { ...review, status } : review)));

      const formData = new FormData();
      formData.append("intent", "update-status");
      formData.append("status", status);
      reviewIds.forEach((id) => formData.append("reviewIds", id));

      fetcher.submit(formData, { method: "post", action: "/reviews" });
    },
    [fetcher],
  );

  // Handle fetcher response
  useMemo(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (!fetcher.data.success) {
        setData(initialData);
        setError(fetcher.data.message || "Failed to update review status");
      } else {
        setError(null);
      }
    }
  }, [fetcher.data, fetcher.state, initialData]);

  function ActionMenuButton({ reviewId }: { reviewId: string }) {
    const [active, setActive] = useState(false);
    const togglePopover = useCallback(() => setActive((prev) => !prev), []);

    return (
      <Popover
        active={active}
        activator={<Button onClick={togglePopover} icon={MenuHorizontalIcon} accessibilityLabel="Options" />}
        onClose={togglePopover}
        preferredAlignment="right"
      >
        <ActionList
          items={[
            {
              content: "Mark as spam",
              onAction: () => {
                handleUpdateStatus([reviewId], "spam");
                togglePopover();
              },
            },
            {
              content: "Reply",
              onAction: () => {
                console.log("Reply clicked");
                togglePopover();
              },
            },
          ]}
        />
      </Popover>
    );
  }

  const rowMarkup = paginatedData.map(({ id, handle, productId, title, body, authorId, rating, submittedAt, status }, index) => {
    const reviewId = id;
    const dateObj = new Date(submittedAt);
    const formattedDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(
      2,
      "0",
    )} at ${dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;

    let statusTone: "info" | "success" | "warning" | "critical";
    switch (status) {
      case "pending":
        statusTone = "info";
        break;
      case "approved":
        statusTone = "success";
        break;
      case "denied":
        statusTone = "warning";
        break;
      case "spam":
        statusTone = "critical";
        break;
      default:
        statusTone = "info";
        break;
    }

    return (
      <IndexTable.Row id={reviewId} key={reviewId} selected={selectedResources.includes(reviewId)} position={index}>
        <IndexTable.Cell>
          <Thumbnail source={thumbnails[productId] || ImageIcon} alt="Product Thumbnail" size="small" />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100" wrap={false}>
            {Array.from({ length: rating }, (_, i) => (
              <Box key={i} width="20px">
                <Icon key={i} source={StarFilledIcon} tone="base" />
              </Box>
            ))}
            {Array.from({ length: 5 - rating }, (_, i) => (
              <Box key={i} width="20px">
                <Icon key={i} source={StarIcon} tone="base" />
              </Box>
            ))}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Box maxWidth="800px">
            <Text as="span" fontWeight="bold">
              {title}
            </Text>
            <br />
            <Text truncate as="span">
              {body}
            </Text>
          </Box>

        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span">{formattedDate}</Text>
          <br />
          <Text as="span" fontWeight="bold">
            {customers[authorId].firstName} {customers[authorId].lastName}
          </Text>
          <br />
          <Text as="span">{customers[authorId].emailAddress}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={statusTone}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div onClick={(e) => e.stopPropagation()}>
            <InlineStack gap="100" wrap={false} align="end">
              {status === "pending" && (
                <Button onClick={() => handleUpdateStatus([reviewId], "approved")} icon={CheckSmallIcon} accessibilityLabel="Approve" />
              )}
              {status === "pending" && (
                <Button onClick={() => handleUpdateStatus([reviewId], "denied")} icon={XSmallIcon} accessibilityLabel="Deny" />
              )}
              <ActionMenuButton reviewId={reviewId} />
            </InlineStack>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Card padding="0">
      {error && <InlineError message={error} fieldID="statusUpdate" />}
      <IndexFilters
        queryValue={queryValue}
        queryPlaceholder="Searching in authors, review titles and bodies"
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => setQueryValue("")}
        cancelAction={{ onAction: () => { }, disabled: false, loading: false }}
        tabs={tabs}
        selected={selected}
        onSelect={setSelected}
        canCreateNewView={false}
        filters={filters}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={filteredData.length}
        promotedBulkActions={bulkActions}
        selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: "Product" },
          {
            id: "rating",
            title: (
              <div onClick={() => handleSort("rating")} style={{ display: "flex", gap: "2px", alignItems: "center", cursor: "pointer" }}>
                Rating
                <Box>
                  <Icon source={sortKey === "rating" && sortDirection === "asc" ? SortAscendingIcon : SortDescendingIcon} tone="base" />
                </Box>
              </div>
            ),
          },
          { title: "Review" },
          {
            id: "author/date",
            title: (
              <div onClick={() => handleSort("submittedAt")} style={{ display: "flex", gap: "2px", alignItems: "center", cursor: "pointer" }}>
                Author/Date
                <Box>
                  <Icon source={sortKey === "submittedAt" && sortDirection === "asc" ? SortAscendingIcon : SortDescendingIcon} tone="base" />
                </Box>
              </div>
            ),
          },
          { title: "Status" },
          { title: "Actions", alignment: "end" },
        ]}
        pagination={{
          hasNext: currentPage * itemsPerPage < filteredData.length,
          hasPrevious: currentPage > 1,
          onNext: () => setCurrentPage((prev) => prev + 1),
          onPrevious: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
        }}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );

  function disambiguateLabel(key: string, value: string | any[]): string {
    switch (key) {
      case "rating":
        return `Rating is between ${value[0]} and ${value[1]}`;
      default:
        return value as string;
    }
  }
}

export default ReviewIndexTable;
