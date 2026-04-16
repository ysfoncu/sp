import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PraksisPlace } from "../types/praksisPlace";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

interface CreatePraksisPlaceViewProps {
  onBack: () => void;
  onCreate: (place: Omit<PraksisPlace, "id">) => void;
}

// Mock API data for simulation
const mockApiResults = [
  {
    name: "Oslo University Hospital",
    address: "Sognsvannsveien 20",
    postalCode: "0372",
    city: "Oslo",
  },
  {
    name: "Akershus University Hospital",
    address: "Sykehusveien 25",
    postalCode: "1478",
    city: "Lørenskog",
  },
  {
    name: "St. Olavs Hospital",
    address: "Postboks 3250 Torgarden",
    postalCode: "7006",
    city: "Trondheim",
  },
  {
    name: "Haukeland University Hospital",
    address: "Haukelandsveien 22",
    postalCode: "5021",
    city: "Bergen",
  },
  {
    name: "University Hospital of North Norway",
    address: "Postboks 100",
    postalCode: "9038",
    city: "Tromsø",
  },
];

export function CreatePraksisPlaceView({
  onBack,
  onCreate,
}: CreatePraksisPlaceViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    typeof mockApiResults
  >([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>(
    {},
  );

  // Real-time search effect
  useEffect(() => {
    if (searchQuery.trim() && !showForm) {
      const results = mockApiResults.filter((result) =>
        result.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, showForm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newPlace: Omit<PraksisPlace, "id"> = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      postalCode: formData.postalCode.trim(),
      totalCapacity: 0,
      currentStudents: 0,
      contactPersons: [],
      contracts: [],
      departments: [],
      tags: [],
    };

    onCreate(newPlace);
  };

  const handleSelectResult = (
    result: (typeof mockApiResults)[0],
  ) => {
    setFormData({
      name: result.name,
      address: result.address,
      city: result.city,
      postalCode: result.postalCode,
    });
    setSearchQuery(result.name);
    setShowResults(false);
    setShowForm(true); // Show the form when a result is selected

    // Blur the search input field to remove focus
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* Breadcrumbs with Back Button */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1 h-7 px-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={onBack}
              className="cursor-pointer hover:text-blue-600 text-gray-500 text-xs"
            >
              Praksis places
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs">
              Create New
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Heading */}
      <h1 className="font-bold text-[#364153] text-[21px] leading-7">
        Add New Praksis Place
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[21px] max-w-[588px]"
      >
        {/* Combined Form Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8.75px] p-[22px] space-y-[17.5px]">
          {/* Search Field */}
          <div
            className="space-y-[7px] relative"
            ref={searchRef}
          >
            <label className="font-medium text-[#364153] text-[12.25px]">
              Praksis Place
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="St. Olavs Hospital"
              className="h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] placeholder:text-[#717182] rounded-[6.75px]"
              ref={searchInputRef}
            />
            <p className="text-[10.5px] text-[#6a7282] leading-[14px]">
              Search for a praksis place to auto-fill the form
              with existing data
            </p>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0 border-gray-100"
                    onClick={() => handleSelectResult(result)}
                  >
                    <p className="font-medium text-[#364153] text-xs">
                      {result.name}
                    </p>
                    <p className="text-[10.5px] text-[#6a7282] mt-1">
                      {result.address}, {result.postalCode}{" "}
                      {result.city}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#e9eaeb]" />

          {/* Text and Create Manual Button - Only show when form is not visible */}
          {!showForm && (
            <div className="flex flex-col gap-[14px]">
              <p className="text-[#1447e6] text-[12.25px]">
                Can't search the Praksis Place?
              </p>
              <Button
                type="button"
                onClick={() => setShowForm(true)}
                className="h-[35px] w-[162.57px] px-[21px] py-[7px] bg-[#155dfc] hover:bg-[#1147d4] text-white text-[12.25px] font-medium rounded-[6.75px]"
              >
                Create manualy
              </Button>
            </div>
          )}

          {/* Form Fields - Only show when showForm is true */}
          {showForm && (
            <>
              {/* Name Field */}
              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Name <span className="text-[#fb2c36]">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="St. Olavs Hospital"
                  className={`h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] placeholder:text-[#717182] rounded-[6.75px] ${
                    errors.name ? "ring-2 ring-red-500" : ""
                  }`}
                />
                {errors.name && (
                  <span className="text-[10.5px] text-red-500">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-[7px]">
                <label className="font-medium text-[#364153] text-[12.25px]">
                  Address{" "}
                  <span className="text-[#fb2c36]">*</span>
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Postboks 3250 Torgarden"
                  className={`h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] placeholder:text-[#717182] rounded-[6.75px] ${
                    errors.address ? "ring-2 ring-red-500" : ""
                  }`}
                />
                {errors.address && (
                  <span className="text-[10.5px] text-red-500">
                    {errors.address}
                  </span>
                )}
              </div>

              {/* Postal Code and City Grid */}
              <div className="grid grid-cols-2 gap-[14px]">
                <div className="space-y-[7px]">
                  <label className="font-medium text-[#364153] text-[12.25px]">
                    Postal Code{" "}
                    <span className="text-[#fb2c36]">*</span>
                  </label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="7006"
                    className={`h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] placeholder:text-[#717182] rounded-[6.75px] ${
                      errors.postalCode
                        ? "ring-2 ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.postalCode && (
                    <span className="text-[10.5px] text-red-500">
                      {errors.postalCode}
                    </span>
                  )}
                </div>

                <div className="space-y-[7px]">
                  <label className="font-medium text-[#364153] text-[12.25px]">
                    City{" "}
                    <span className="text-[#fb2c36]">*</span>
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        city: e.target.value,
                      })
                    }
                    placeholder="Trondheim"
                    className={`h-[35px] bg-[#f3f3f5] border-0 text-[12.25px] placeholder:text-[#717182] rounded-[6.75px] ${
                      errors.city ? "ring-2 ring-red-500" : ""
                    }`}
                  />
                  {errors.city && (
                    <span className="text-[10.5px] text-red-500">
                      {errors.city}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Information Note */}
        <div className="p-[15px] bg-[#eff6ff] border border-[#bedbff] rounded-[8.75px]">
          <div className="flex flex-col gap-[10px] py-[2px]">
            <p className="font-bold text-[#1447e6] text-[12.25px]">
              Note:
            </p>
            <p className="text-[#1447e6] text-[12.25px] leading-[17.5px]">
              After creating the praksis place, you can add
              contact persons, contracts, departments, and
              supervisors from the detail view.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[10.5px] justify-end h-[35px]">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-[35px] px-[22px] py-[8px] text-[12.25px] font-medium border-[rgba(0,0,0,0.1)] rounded-[6.75px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-[35px] w-[162.57px] px-[21px] py-[7px] bg-[#155dfc] hover:bg-[#1147d4] text-white text-[12.25px] font-medium rounded-[6.75px]"
          >
            Add Praksis Place
          </Button>
        </div>
      </form>
    </div>
  );
}