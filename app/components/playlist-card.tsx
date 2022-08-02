interface PlaylistCardProps {
  title: string;
  totalTracks: number;
  imgSrc: string;
  href: string;
  username?: string | null;
  description?: string | null;
}

export function PlaylistCard({
  title,
  username,
  totalTracks,
  imgSrc,
  description,
  href,
}: PlaylistCardProps) {
  return (
    <div className="flex w-full items-center rounded-lg bg-emerald-100 px-4 pt-14 pb-8 shadow-2xl sm:px-6 sm:pt-8 md:p-4 lg:p-4">
      <div className="grid w-full grid-cols-1 items-start gap-y-8 gap-x-6 sm:grid-cols-12 lg:gap-x-8">
        <div className="sm:col-span-4 lg:col-span-3">
          <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg bg-gray-100">
            <a href={href} target="_blank" rel="noreferrer">
              <img
                src={imgSrc}
                alt="Playlist cover"
                className="object-cover object-center"
              />
            </a>
          </div>
        </div>
        <div className="sm:col-span-8 lg:col-span-9">
          <a
            className="text-2xl font-extrabold text-gray-900 sm:pr-12"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>

          <section aria-labelledby="information-heading" >
            <h3 id="information-heading" className="sr-only">
              Playist information
            </h3>

            <div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Playlist</span>
                  {username && (
                    <>
                      <span>-</span>
                      <span>{username}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600">{totalTracks} tracks</p>

            <div className="mt-4">
              <h4 className="sr-only">Description</h4>
              <p className="text-xs text-gray-600">
                {description ?? "No description available for this playlist"}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
