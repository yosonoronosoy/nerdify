import { Fragment, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useLocation, useNavigate } from "@remix-run/react";
import { classNames } from "~/utils";

export function DialogModal({
  children,
  formId,
  routeState,
  prevUrl,
  buttonSection,
  confirmButtonTitle = "Confirm",
  cancelButtonTitle = "Cancel",
  isConfirm = true,
  initialOpen = true,
}: {
  children: React.ReactNode;
  buttonSection?: React.ReactNode;
  prevUrl?: string;
  isConfirm?: boolean;
  confirmButtonTitle?: string;
  cancelButtonTitle?: string;
  formId?: string;
  routeState?: any;
  initialOpen?: boolean;
}) {
  const cancelButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(initialOpen);

  if (open !== initialOpen) {
    console.log({ open, initialOpen });
    setOpen(initialOpen);
  }

  function handleClose() {
    setOpen(false);
    navigate(prevUrl ?? location.pathname, { state: routeState });
  }

  return (
    // FIX: Buttons title and what to do after submission
    // FIX: Add Form component
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={handleClose}
      >
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle">
              <div className="relative">{children}</div>
              {buttonSection ?? (
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    className={classNames(
                      "inline-flex w-full justify-center rounded-md border border-transparent  px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2  focus:ring-offset-2 sm:col-start-2 sm:text-sm",
                      isConfirm
                        ? "bg-indigo-600 hover:bg-indigo-700  focus:ring-indigo-500"
                        : "bg-red-600 hover:bg-red-700  focus:ring-red-500"
                    )}
                    form={formId}
                  >
                    {confirmButtonTitle}
                  </button>
                  <button
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={handleClose}
                    ref={cancelButtonRef}
                  >
                    {cancelButtonTitle}
                  </button>
                </div>
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
