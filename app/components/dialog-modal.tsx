import { Fragment, useRef, useState, createContext, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useLocation, useNavigate } from "@remix-run/react";
import { classNames } from "~/utils";
import { ClockIcon } from "@heroicons/react/outline";

type HandleClose = () => void;
const HandleCloseContext = createContext<HandleClose | undefined>(undefined);

export function useHandleClose() {
  const handleClose = useContext(HandleCloseContext);

  if (typeof handleClose === "undefined") {
    throw new Error("useHandleClose must be used within a DialogModal");
  }

  return handleClose;
}

function HandleCloseProvider({
  children,
  handleClose,
}: {
  children: React.ReactNode;
  handleClose: HandleClose;
}) {
  return (
    <HandleCloseContext.Provider value={handleClose}>
      {children}
    </HandleCloseContext.Provider>
  );
}

export function DialogModal({
  children,
  formId,
  routeState, //WARNING: i dont like this
  prevUrl,
  buttonSection,
  header,
  headingIcon,
  heading = "Replace me with heading prop",
  subHeading = "Replace me with subHeading prop",
  confirmButtonTitle = "Confirm",
  cancelButtonTitle = "Cancel",
  isConfirm = true,
  initialOpen = true,
}: {
  children: React.ReactNode;
  buttonSection?: React.ReactNode;
  header?: React.ReactNode;
  heading?: string;
  subHeading?: string;
  headingIcon?: React.ReactNode;
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
        <HandleCloseProvider handleClose={handleClose}>
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
                {header ?? (
                  <ModalHeader>
                    {headingIcon}
                    <ModalHeaderTitle>{heading}</ModalHeaderTitle>
                    <ModalHeaderSubTitle>{subHeading}</ModalHeaderSubTitle>
                  </ModalHeader>
                )}

                <div className="relative">{children}</div>
                {buttonSection === null
                  ? null
                  : buttonSection ?? (
                      <DefaultButtonSection>
                        <CancelButton
                          onClick={handleClose}
                          ref={cancelButtonRef}
                        >
                          {cancelButtonTitle}
                        </CancelButton>
                        <ConfirmButton isConfirm={isConfirm} formId={formId}>
                          {confirmButtonTitle}
                        </ConfirmButton>
                      </DefaultButtonSection>
                    )}
              </div>
            </Transition.Child>
          </div>
        </HandleCloseProvider>
      </Dialog>
    </Transition.Root>
  );
}

export function DefaultButtonSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
      {children}
    </div>
  );
}

type CancelButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export function CancelButton({ children, ...props }: CancelButtonProps) {
  return (
    <button
      {...props}
      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
    >
      {children}
    </button>
  );
}

export function ConfirmButton({
  children,
  isConfirm,
  formId,
  ...props
}: CancelButtonProps & { isConfirm?: boolean; formId?: string }) {
  return (
    <button
      {...props}
      className={classNames(
        "inline-flex w-full justify-center rounded-md border border-transparent  px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2  focus:ring-offset-2 sm:text-sm",
        isConfirm
          ? "bg-indigo-600 hover:bg-indigo-700  focus:ring-indigo-500"
          : "bg-red-600 hover:bg-red-700  focus:ring-red-500"
      )}
      form={formId}
    >
      {children}
    </button>
  );
}

interface Props {
  children: React.ReactNode;
}

export function ModalHeader({ children }: Props) {
  return (
    <div className="relative grid place-items-center gap-4">{children}</div>
  );
}

export function ModalHeaderTitle({ children }: Props) {
  return (
    <Dialog.Title
      as="h3"
      className="text-lg font-medium leading-6 text-gray-900"
    >
      {children}
    </Dialog.Title>
  );
}

export function ModalHeaderSubTitle({ children }: Props) {
  return (
    <Dialog.Title
      as="h4"
      className="mt-[-1rem] text-sm leading-6 text-gray-500"
    >
      {children}
    </Dialog.Title>
  );
}
