function WeatherCard({ title, value, unit, icon }) {
  return (
    <div className="rounded-xl border p-5 shadow-sm">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold">
        {value}
        <span className="ml-1 text-lg">
          {unit}
        </span>
      </p>
    </div>
  );
}

export default WeatherCard;