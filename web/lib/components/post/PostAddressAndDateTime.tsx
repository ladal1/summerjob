import { formatDateShort } from 'lib/helpers/helpers'
import { PostComplete } from 'lib/types/post'
import React from 'react'
import { IconAndLabel } from '../forms/IconAndLabel'

interface PostAddressAndDateTimeProps {
  item: PostComplete
  showTime?: boolean
  fontSize?: string
}

export const PostAddressAndDateTime = ({
  item,
  showTime = true,
  fontSize = '',
}: PostAddressAndDateTimeProps) => {
  return (
    <>
      <div
        className={`d-flex flex-wrap justify-content-start allign-items-center text-muted ${fontSize}`}
      >
        {item.availability.length > 0 && (
          <div className="mb-2 me-4 d-flex align-items-center flex-wrap">
            <i className="fas fa-calendar me-2 "></i>
            {item.availability.map((date, index) => (
              <React.Fragment key={`date-${date.toString()}`}>
                {date !== null && (
                  <div className="text-truncate">
                    {formatDateShort(new Date(date))}
                    {index < item.availability.length - 1 && ', '}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {showTime && item.timeFrom && item.timeTo && (
          <div className="mb-2 me-4">
            <IconAndLabel
              label={`${item.timeFrom} - ${item.timeTo}`}
              icon="fas fa-clock"
            />
          </div>
        )}
        {item.address && (
          <div>
            <IconAndLabel label={item.address} icon="fas fa-map" />
          </div>
        )}
      </div>
    </>
  )
}
