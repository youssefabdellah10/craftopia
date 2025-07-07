import { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";

const ProductPersonalization = ({ options = {} }) => {
    const [selectedOptions, setSelectedOptions] = useState({});
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const handleSelect = (attribute, value) => {
        setSelectedOptions((prev) => {
            const current = prev[attribute];
            const isSame = current === value;

            const updated = {
                ...prev,
                [attribute]: isSame ? null : value,
            };

            if (!updated[attribute]) delete updated[attribute];

            return updated;
        });

        setSaved(false);
        setError("");
    };

    const handleEngravingChange = (text) => {
        setSelectedOptions((prev) => ({
            ...prev,
            engraving: text.trim() === "" ? undefined : text,
        }));
        setSaved(false);
        setError("");
    };

    const isColorAttr = (attr) => attr.toLowerCase() === "color";

    const handleSave = () => {
        const hasSelection = Object.entries(selectedOptions).some(
            ([, value]) => value && value !== ""
        );

        if (!hasSelection) {
            setError("Please select at least one personalization option.");
            return;
        }

        setError("");
        setSaved(true);
        console.log("Saved Personalization:", selectedOptions);
    };

    return (
        <div className="p-6 border border-dashed border-[#E07385] rounded-2xl bg-[#FEF2F3] mt-6 space-y-8 shadow-sm">
            <div>
                <h3 className="text-2xl font-bold text-[#E07385]">Personalize This Product</h3>
                <p className="text-sm text-gray-700 mt-1">
                    Optional customization available. Choose what you'd like to personalize below.
                </p>
            </div>

            {Object.entries(options).map(([attribute, config]) => (
                <div key={attribute} className="space-y-2">
                    <label className="block text-m font-semibold text-[#7a162e] capitalize">
                        {attribute}{" "}
                        {config.price > 0 && (
                            <span className="text-s text-gray-800 font-normal">
                                (+${config.price})
                            </span>
                        )}
                    </label>

                    {attribute.toLowerCase() === "engraving" ? (
                        <input
                            type="text"
                            placeholder="Enter engraving text..."
                            value={selectedOptions.engraving || ""}
                            onChange={(e) => handleEngravingChange(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[#f3c7ce] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E07385]"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {config.values.map((value, index) => {
                                const isSelected = selectedOptions[attribute] === value;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(attribute, value)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-all font-medium shadow-sm
                      ${isSelected
                                                ? "bg-[#E07385] text-white border-[#E07385]"
                                                : "bg-white text-[#7a162e] border-[#f3c7ce] hover:bg-[#fde3e7]"
                                            }`}
                                    >
                                        {isColorAttr(attribute) && (
                                            <span
                                                className="inline-block w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: value.toLowerCase() }}
                                            />
                                        )}
                                        <span>{value}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 font-medium bg-[#ffe7ea] border border-[#f8cfd6] px-4 py-2 rounded-md">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#fbd5db]">
                <button
                    onClick={handleSave}
                    className="mt-3 bg-white text-[#E07385] border border-[#E07385] px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#fde3e7] transition"
                >
                    Save Customization
                </button>

                {saved && (
                    <span className="mt-3 text-green-600 font-medium flex items-center gap-1 text-sm">
                        <Check size={16} /> Saved!
                    </span>
                )}
            </div>
        </div>
    );
};

export default ProductPersonalization;
